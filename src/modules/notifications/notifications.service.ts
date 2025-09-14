import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './repositories/notifications.repository';
import { CreateNotificationDto } from './dto/CreateNotificationDto.dto';
import { UpdateNotificationDto } from './dto/UpdateNotification.dto';
import { Notification } from './notifications.schema';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  // Tạo mới thông báo
  async create(createDto: CreateNotificationDto): Promise<Notification> {
    try {
      console.log('🔍 NotificationsService.create called with:', createDto);
      const result = await this.notificationsRepository.create(createDto);
      console.log('✅ NotificationsService.create successful:', result);
      return result;
    } catch (error) {
      console.error('❌ NotificationsService.create error:', error);
      throw error;
    }
  }

  // Lấy tất cả thông báo
  async findAll(): Promise<Notification[]> {
    return this.notificationsRepository.findAll();
  }

  // Lấy thông báo theo userId
  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.findByUser(userId);
  }

  // Lấy thông báo theo id
  async findOne(id: string): Promise<Notification> {
    const notif = await this.notificationsRepository.findById(id);
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);
    return notif;
  }

  // Cập nhật thông báo
  async update(
    id: string,
    updateDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notif = await this.notificationsRepository.update(id, updateDto);
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);
    return notif;
  }

  // Xoá thông báo
  async remove(id: string): Promise<Notification> {
    const notif = await this.notificationsRepository.remove(id);
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);
    return notif;
  }

  // Đếm số notification chưa đọc của user
  async countUnreadByUser(userId: string): Promise<number> {
    return this.notificationsRepository.countUnreadByUser(userId);
  }

  // Lấy notification chưa đọc của user
  async findUnreadByUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.findUnreadByUser(userId);
  }

  // Đánh dấu notification là đã đọc
  async markAsRead(id: string): Promise<Notification> {
    const notif = await this.notificationsRepository.markAsRead(id);
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);
    return notif;
  }

  // Đánh dấu tất cả notification của user là đã đọc
  async markAllAsReadByUser(userId: string): Promise<number> {
    return this.notificationsRepository.markAllAsReadByUser(userId);
  }
}
