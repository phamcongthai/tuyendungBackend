import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import {NotificationsService} from './notifications.service';
import {NotificationsGateway} from './notifications.getway';
import {CreateNotificationDto} from './dto/CreateNotificationDto.dto';
import {UpdateNotificationDto} from './dto/UpdateNotification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway
  ) {}

  // Tạo mới thông báo
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  // Lấy tất cả thông báo (hoặc theo userId nếu có query)
  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('audience') audience?: 'recruiter' | 'client' | 'both',
  ) {
    if (userId) {
      return this.notificationsService.findByUser(userId, audience);
    }
    return this.notificationsService.findAll();
  }

  // Lấy 1 thông báo theo id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  // Cập nhật thông báo (ví dụ: mark as read)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  // Xoá thông báo
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  // Đếm số notification chưa đọc của user
  @Get('unread-count/:userId')
  async getUnreadCount(@Param('userId') userId: string) {
    const count = await this.notificationsService.countUnreadByUser(userId);
    return { unreadCount: count };
  }

  // Lấy notification chưa đọc của user
  @Get('unread/:userId')
  async getUnreadNotifications(@Param('userId') userId: string) {
    return this.notificationsService.findUnreadByUser(userId);
  }

  // Đánh dấu notification là đã đọc
  @Patch('mark-read/:id')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  // Đánh dấu tất cả notification của user là đã đọc
  @Patch('mark-all-read/:userId')
  async markAllAsRead(@Param('userId') userId: string) {
    const count = await this.notificationsService.markAllAsReadByUser(userId);
    return { success: true, markedCount: count };
  }

  // Test gửi thông báo trực tiếp (debug)
  @Post('test-send')
  async testSendNotification(@Body() body: { userId: string; message: string; type?: string }) {
    const notification = await this.notificationsService.create({
      userId: body.userId,
      message: body.message,
      type: (body.type as any) || 'other'
    });
    
    // Gửi qua Socket.IO
    await this.notificationsGateway.sendNotificationToUser(body.userId, notification);
    
    return { success: true, notification };
  }
}
