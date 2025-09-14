import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/CreateNotificationDto.dto';
import { NotificationType } from './notifications.schema';

@WebSocketGateway({
  cors: {
    origin: '*', // Cho phép FE kết nối, có thể giới hạn domain
  },
  namespace: '/notifications', // Namespace riêng cho notification
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map để lưu trữ recruiter online và room của họ
  private onlineRecruiters = new Map<string, string>(); // recruiterId -> socketId
  private socketToRecruiter = new Map<string, string>(); // socketId -> recruiterId

  constructor(private readonly notificationsService: NotificationsService) {}

  // Khi client kết nối
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Khi client ngắt kết nối
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Xóa recruiter khỏi danh sách online nếu có
    const recruiterId = this.socketToRecruiter.get(client.id);
    if (recruiterId) {
      this.onlineRecruiters.delete(recruiterId);
      this.socketToRecruiter.delete(client.id);
      console.log(`Recruiter ${recruiterId} went offline`);
    }
  }

  // Recruiter join vào room (online)
  @SubscribeMessage('recruiterJoin')
  handleRecruiterJoin(
    @MessageBody() data: { recruiterId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { recruiterId } = data;
    
    // Lưu thông tin recruiter online
    this.onlineRecruiters.set(recruiterId, client.id);
    this.socketToRecruiter.set(client.id, recruiterId);
    
    // Join vào room của recruiter
    client.join(recruiterId);
    
    console.log(`Recruiter ${recruiterId} joined room and is now online`);
    
    // Gửi số notification chưa đọc khi recruiter online
    this.sendUnreadCountToRecruiter(recruiterId);
    
    return { event: 'recruiterJoined', recruiterId, online: true };
  }

  // Client join vào room theo userId (cho user thường)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(userId);
    console.log(`Client ${client.id} joined room ${userId}`);
    return { event: 'joinedRoom', room: userId };
  }

  // Khi có thông báo mới
  @SubscribeMessage('createNotification')
  async handleCreateNotification(
    @MessageBody() createDto: CreateNotificationDto,
  ) {
    const notification = await this.notificationsService.create(createDto);
    this.server
      .to(createDto.userId.toString())
      .emit('newNotification', notification);
    return notification;
  }

  // Kiểm tra recruiter có online không
  isRecruiterOnline(recruiterId: string): boolean {
    return this.onlineRecruiters.has(recruiterId);
  }

  // Gửi số notification chưa đọc cho recruiter
  async sendUnreadCountToRecruiter(recruiterId: string) {
    try {
      const unreadCount = await this.notificationsService.countUnreadByUser(recruiterId);
      this.server.to(recruiterId).emit('unreadCount', { unreadCount });
      console.log(`📊 Sent unread count ${unreadCount} to recruiter ${recruiterId}`);
    } catch (error) {
      console.error(`❌ Error sending unread count to recruiter ${recruiterId}:`, error);
    }
  }

  // Gửi notification cho recruiter khi có application mới
  async sendApplicationNotification(
    recruiterId: string,
    applicationId: string,
    jobId: string,
    applicantId: string,
    jobTitle: string,
    applicantName: string
  ) {
    try {
      console.log(`📤 Sending application notification to recruiter ${recruiterId}`);
      
      const notificationData = {
        userId: recruiterId,
        message: `Có đơn ứng tuyển mới cho vị trí "${jobTitle}" từ ${applicantName}`,
        type: NotificationType.APPLICATION_SUBMITTED,
        applicationId,
        jobId,
        applicantId,
        metadata: {
          jobTitle,
          applicantName,
          applicationId
        }
      };

      // Lưu notification vào database
      const savedNotification = await this.notificationsService.create(notificationData);
      console.log(`✅ Application notification saved to database:`, savedNotification);

      // Kiểm tra recruiter có online không
      if (this.isRecruiterOnline(recruiterId)) {
        // Th1: Recruiter online - gửi realtime notification
        this.server.to(recruiterId).emit('newNotification', savedNotification);
        console.log(`📡 Realtime notification sent to online recruiter ${recruiterId}`);
      } else {
        // Th2: Recruiter offline - chỉ lưu vào DB, sẽ hiển thị khi đăng nhập
        console.log(`📝 Notification saved for offline recruiter ${recruiterId}`);
      }

      return savedNotification;
    } catch (error) {
      console.error(`❌ Error sending application notification:`, error);
      throw error;
    }
  }

  // Emit thủ công từ BE (giữ nguyên cho backward compatibility)
  async sendNotificationToUser(userId: string, notification: any) {
    try {
      console.log(`📤 Creating notification for user ${userId}:`, notification);
      
      // Xử lý trường hợp userId là 'unknown'
      let actualUserId = userId;
      if (userId === 'unknown') {
        // Tạo một ObjectId tạm thời hoặc sử dụng một ID mặc định
        actualUserId = '000000000000000000000000'; // ObjectId mặc định
        console.log('⚠️ Using fallback userId for unknown recruiter');
      }
      
      // Lưu notification vào database trước
      const savedNotification = await this.notificationsService.create({
        userId: actualUserId,
        message: notification.message,
        type: notification.type || 'other'
      });
      
      console.log(`✅ Notification saved to database:`, savedNotification);
      
      // Sau đó emit qua Socket.IO (chỉ nếu userId không phải unknown)
      if (userId !== 'unknown') {
        this.server.to(userId).emit('newNotification', savedNotification);
        console.log(`📡 Notification emitted to room ${userId}`);
      } else {
        console.log(`⚠️ Skipping Socket.IO emit for unknown user`);
      }
      
      return savedNotification;
    } catch (error) {
      console.error(`❌ Error in sendNotificationToUser:`, error);
      throw error;
    }
  }
}
