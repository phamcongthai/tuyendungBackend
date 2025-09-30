// src/modules/notifications/schemas/notification.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  // Ứng viên → Nhà tuyển dụng
  NEW_APPLICATION = 'NEW_APPLICATION',

  // Nhà tuyển dụng → Ứng viên
  APPLICATION_VIEWED = 'APPLICATION_VIEWED',
  APPLICATION_PASSED = 'APPLICATION_PASSED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',

  INTERVIEW_INVITED = 'INTERVIEW_INVITED',
  INTERVIEW_RESULT = 'INTERVIEW_RESULT',

  OFFER_SENT = 'OFFER_SENT',
  OFFER_RESPONSE = 'OFFER_RESPONSE',

  HIRED = 'HIRED',

  SYSTEM = 'SYSTEM',
  MESSAGE = 'MESSAGE',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Người nhận thông báo

  @Prop({ required: true, trim: true })
  message: string; // Nội dung thông báo

  @Prop({ type: String, enum: NotificationType, default: NotificationType.OTHER })
  type: NotificationType; // Loại thông báo

  @Prop({ default: false })
  isRead: boolean; // Đã đọc hay chưa

  @Prop({ type: Date, default: null })
  readAt?: Date; // Thời điểm đọc

  @Prop({ default: false })
  deleted: boolean; // Soft delete (nếu muốn cho phép xóa mềm)

  // Thông tin liên quan đến application
  @Prop({ type: Types.ObjectId, ref: 'Application' })
  applicationId?: Types.ObjectId; // ID của đơn ứng tuyển

  @Prop({ type: Types.ObjectId, ref: 'Job' })
  jobId?: Types.ObjectId; // ID của job

  @Prop({ type: Types.ObjectId, ref: 'Account' })
  applicantId?: Types.ObjectId; // ID của người ứng tuyển

  // Thông tin bổ sung
  @Prop({ type: Object })
  metadata?: any; // Dữ liệu bổ sung (tên job, tên ứng viên, etc.)

  // Phân nhóm đối tượng nhận: recruiter | client | both
  @Prop({ type: String, enum: ['recruiter', 'client', 'both'], default: 'both' })
  audience?: 'recruiter' | 'client' | 'both';
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
