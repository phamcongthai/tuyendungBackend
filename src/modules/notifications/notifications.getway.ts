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

  // Map cho client (ứng viên) online và room của họ
  private onlineClients = new Map<string, string>(); // clientId -> socketId
  private socketToClient = new Map<string, string>(); // socketId -> clientId

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

    // Xóa client khỏi danh sách online nếu có
    const clientUserId = this.socketToClient.get(client.id);
    if (clientUserId) {
      this.onlineClients.delete(clientUserId);
      this.socketToClient.delete(client.id);
      console.log(`Client user ${clientUserId} went offline`);
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

  // Client (ứng viên) join room riêng
  @SubscribeMessage('clientJoin')
  handleClientJoin(
    @MessageBody() data: { clientId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { clientId } = data;

    // Lưu thông tin client online
    this.onlineClients.set(clientId, client.id);
    this.socketToClient.set(client.id, clientId);

    // Join vào room của client
    client.join(clientId);

    console.log(`Client user ${clientId} joined room and is now online`);
    return { event: 'clientJoined', clientId, online: true };
  }

  // Ứng viên cập nhật trạng thái hồ sơ -> emit cho recruiter
  @SubscribeMessage('clientApplicationStatusChanged')
  async handleClientApplicationStatusChanged(
    @MessageBody() data: {
      recruiterId: string; // recruiter nhận thông báo
      applicationId: string;
      jobId: string;
      applicantId: string;
      applicantName?: string;
      jobTitle?: string;
      status:
        | 'APPLICATION_VIEWED'
        | 'APPLICATION_PASSED'
        | 'APPLICATION_REJECTED'
        | 'INTERVIEW_INVITED'
        | 'INTERVIEW_RESULT'
        | 'OFFER_SENT'
        | 'OFFER_RESPONSE'
        | 'HIRED';
      message?: string;
      metadata?: any;
    },
  ) {
    const {
      recruiterId,
      applicationId,
      jobId,
      applicantId,
      applicantName,
      jobTitle,
      status,
      message,
      metadata,
    } = data;

    // Map status string sang enum NotificationType
    const statusToType: Record<string, NotificationType> = {
      APPLICATION_VIEWED: NotificationType.APPLICATION_VIEWED,
      APPLICATION_PASSED: NotificationType.APPLICATION_PASSED,
      APPLICATION_REJECTED: NotificationType.APPLICATION_REJECTED,
      INTERVIEW_INVITED: NotificationType.INTERVIEW_INVITED,
      INTERVIEW_RESULT: NotificationType.INTERVIEW_RESULT,
      OFFER_SENT: NotificationType.OFFER_SENT,
      OFFER_RESPONSE: NotificationType.OFFER_RESPONSE,
      HIRED: NotificationType.HIRED,
    };

    const type = statusToType[status] ?? NotificationType.OTHER;

    const notificationData = {
      userId: recruiterId,
      message:
        message ||
        `Ứng viên ${applicantName || 'N/A'} cập nhật trạng thái: ${status.replaceAll('_', ' ')}`,
      type,
      applicationId,
      jobId,
      applicantId,
      metadata: {
        ...(metadata || {}),
        jobTitle,
        applicantName,
        status,
      },
    } as any;

    // Lưu vào DB
    const saved = await this.notificationsService.create(notificationData);

    // Emit realtime tới recruiter room
    this.server.to(recruiterId).emit('newNotification', saved);

    return saved;
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

  // Kiểm tra client có online không
  isClientOnline(clientId: string): boolean {
    return this.onlineClients.has(clientId);
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
      
      const notificationData: CreateNotificationDto = {
        userId: recruiterId,
        message: `Có đơn ứng tuyển mới cho vị trí "${jobTitle}" từ ${applicantName}`,
        type: NotificationType.NEW_APPLICATION,
        applicationId,
        jobId,
        applicantId,
        metadata: {
          jobTitle,
          applicantName,
          applicationId
        },
        audience: 'recruiter'
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

  // Gửi thông báo cho ứng viên khi NTD đã xem hồ sơ
  async sendApplicationViewedToClient(
    clientUserId: string,
    applicationId: string,
    jobId: string,
    jobTitle: string
  ) {
    try {
      const notificationData: CreateNotificationDto = {
        userId: clientUserId,
        message: `Nhà tuyển dụng đã xem hồ sơ của bạn cho vị trí "${jobTitle}"`,
        type: NotificationType.APPLICATION_VIEWED,
        applicationId,
        jobId,
        metadata: {
          jobTitle,
          applicationId
        },
        audience: 'client'
      };

      const savedNotification = await this.notificationsService.create(notificationData);

      if (this.isClientOnline(clientUserId)) {
        this.server.to(clientUserId).emit('newNotification', savedNotification);
        console.log(`📡 Realtime notification sent to online client ${clientUserId}`);
      } else {
        console.log(`📝 Notification saved for offline client ${clientUserId}`);
      }

      return savedNotification;
    } catch (error) {
      console.error(`❌ Error sending application viewed notification to client:`, error);
      throw error;
    }
  }

  // Gửi thông báo cho ứng viên khi NTD mời phỏng vấn
  async sendInterviewInvitedToClient(
    clientUserId: string,
    applicationId: string,
    jobId: string,
    jobTitle: string,
    whenText: string,
    whereText: string,
  ) {
    try {
      const notificationData: CreateNotificationDto = {
        userId: clientUserId,
        message: `Bạn được mời phỏng vấn cho vị trí "${jobTitle}" vào lúc ${whenText} tại ${whereText}`,
        type: NotificationType.INTERVIEW_INVITED,
        applicationId,
        jobId,
        metadata: {
          jobTitle,
          applicationId,
          interviewDate: whenText,
          interviewLocation: whereText,
        },
        audience: 'client'
      };

      const savedNotification = await this.notificationsService.create(notificationData);

      if (this.isClientOnline(clientUserId)) {
        this.server.to(clientUserId).emit('newNotification', savedNotification);
        console.log(`📡 Realtime INTERVIEW_INVITED sent to online client ${clientUserId}`);
      } else {
        console.log(`📝 INTERVIEW_INVITED saved for offline client ${clientUserId}`);
      }

      return savedNotification;
    } catch (error) {
      console.error(`❌ Error sending interview invited notification to client:`, error);
      throw error;
    }
  }

  // Gửi thông báo shortlist cho ứng viên
  async sendApplicationShortlistedToClient(
    clientUserId: string,
    applicationId: string,
    jobId: string,
    jobTitle: string,
  ) {
    try {
      const notificationData: CreateNotificationDto = {
        userId: clientUserId,
        message: `Hồ sơ của bạn đã được đưa vào shortlist cho vị trí "${jobTitle}"`,
        type: NotificationType.APPLICATION_PASSED,
        applicationId,
        jobId,
        metadata: { jobTitle, applicationId },
        audience: 'client'
      };

      const savedNotification = await this.notificationsService.create(notificationData);

      if (this.isClientOnline(clientUserId)) {
        this.server.to(clientUserId).emit('newNotification', savedNotification);
        console.log(`📡 Realtime APPLICATION_PASSED sent to online client ${clientUserId}`);
      }
      return savedNotification;
    } catch (error) {
      console.error('❌ Error sending shortlist notification:', error);
      throw error;
    }
  }

  // Gửi thông báo từ chối cho ứng viên
  async sendApplicationRejectedToClient(
    clientUserId: string,
    applicationId: string,
    jobId: string,
    jobTitle: string,
  ) {
    try {
      const notificationData: CreateNotificationDto = {
        userId: clientUserId,
        message: `Rất tiếc, hồ sơ của bạn đã bị từ chối cho vị trí "${jobTitle}"`,
        type: NotificationType.APPLICATION_REJECTED,
        applicationId,
        jobId,
        metadata: { jobTitle, applicationId },
        audience: 'client'
      };

      const savedNotification = await this.notificationsService.create(notificationData);
      if (this.isClientOnline(clientUserId)) {
        this.server.to(clientUserId).emit('newNotification', savedNotification);
        console.log(`📡 Realtime APPLICATION_REJECTED sent to online client ${clientUserId}`);
      }
      return savedNotification;
    } catch (error) {
      console.error('❌ Error sending rejection notification:', error);
      throw error;
    }
  }
}
