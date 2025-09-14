import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Notification, NotificationDocument } from '../notifications.schema';
import { CreateNotificationDto } from '../dto/CreateNotificationDto.dto';
import { UpdateNotificationDto } from '../dto/UpdateNotification.dto';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    try {
      console.log('🔍 NotificationsRepository.create called with:', createDto);
      
      // Convert string IDs to ObjectIds
      const notificationData = {
        ...createDto,
        userId: new Types.ObjectId(createDto.userId),
        applicationId: createDto.applicationId ? new Types.ObjectId(createDto.applicationId) : undefined,
        jobId: createDto.jobId ? new Types.ObjectId(createDto.jobId) : undefined,
        applicantId: createDto.applicantId ? new Types.ObjectId(createDto.applicantId) : undefined,
      };
      
      console.log('📄 Creating notification data:', notificationData);
      const notification = new this.notificationModel(notificationData);
      console.log('📄 Creating notification document:', notification);
      const saved = await notification.save();
      console.log('✅ NotificationsRepository.create successful:', saved);
      return saved;
    } catch (error) {
      console.error('❌ NotificationsRepository.create error:', error);
      throw error;
    }
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationModel.find().exec();
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findById(id: string): Promise<Notification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.notificationModel.findById(id).exec();
  }

  async update(
    id: string,
    updateDto: UpdateNotificationDto,
  ): Promise<Notification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.notificationModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Notification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.notificationModel.findByIdAndDelete(id).exec();
  }

  // Đếm số notification chưa đọc của user
  async countUnreadByUser(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
      deleted: false
    }).exec();
  }

  // Lấy notification chưa đọc của user
  async findUnreadByUser(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({
      userId: new Types.ObjectId(userId),
      isRead: false,
      deleted: false
    }).sort({ createdAt: -1 }).exec();
  }

  // Đánh dấu notification là đã đọc
  async markAsRead(id: string): Promise<Notification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.notificationModel.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    ).exec();
  }

  // Đánh dấu tất cả notification của user là đã đọc
  async markAllAsReadByUser(userId: string): Promise<number> {
    const result = await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        isRead: false,
        deleted: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    ).exec();
    return result.modifiedCount;
  }
}
