import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecruiterDocument = Recruiter & Document;

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum CompanyRole {
  ADMIN = 'admin',   // quản lý cao nhất của công ty
  MEMBER = 'member', // HR thông thường
}

@Schema({ timestamps: true })
export class Recruiter {
  // Liên kết tới account (login info)
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true, unique: true })
  accountId: Types.ObjectId;

  // Email (để tránh duplicate key error)
  @Prop({ required: false, unique: true, sparse: true })
  email?: string;

  // Liên kết tới Company
  @Prop({ type: Types.ObjectId, ref: 'Company', required: false })
  companyId: Types.ObjectId;

  // Chức vụ (HR Manager, HR Executive...)
  @Prop({ required: false, trim: true })
  position?: string;

  // Giới tính
  @Prop({ type: String, enum: Gender, required: false })
  gender: Gender;

  // Địa chỉ hành chính
  @Prop({ required: false })
  province?: string;

  @Prop({ required: false })
  district?: string;

  // Avatar
  @Prop({ default: null })
  avatar: string;

  // Vai trò trong công ty (admin hoặc member)
  @Prop({ type: String, enum: CompanyRole, default: CompanyRole.MEMBER })
  companyRole: CompanyRole;

  // Trạng thái hoạt động
  @Prop({ default: true })
  isActive: boolean;

  // Xóa mềm
  @Prop({ default: false })
  deleted: boolean;
}

// Tạo schema Mongoose
export const RecruiterSchema = SchemaFactory.createForClass(Recruiter);
