import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true, collection: 'companies' })
export class Company {
  @Prop({ required: true, unique: true, trim: true })
  slug: string; // Slug duy nhất cho public URL
  @Prop({ required: true, unique: true, trim: true })
  name: string; // Tên công ty

  @Prop({ trim: true })
  description?: string; // Mô tả công ty

  @Prop({ trim: true })
  logo?: string; // Logo công ty

  @Prop({ trim: true })
  website?: string; // Website

  @Prop({ trim: true })
  email?: string; // Email liên hệ

  @Prop({ trim: true })
  phone?: string; // Điện thoại liên hệ

  @Prop({ trim: true })
  address?: string; // Địa chỉ đầy đủ

  @Prop({ type: [String], default: [] })
  industries: string[]; // Ngành nghề

  @Prop({ trim: true })
  size?: string; // Quy mô công ty (VD: 11-50, 51-200...)

  @Prop({ trim: true })
  taxCode?: string; // Mã số thuế

  @Prop({ trim: true })
  foundedYear?: string; // Năm thành lập

  @Prop({ default: true })
  isActive: boolean; // Trạng thái hoạt động

  // Liên kết Recruiter
  @Prop({ type: [Types.ObjectId], ref: 'Recruiter', default: [] })
  recruiters: Types.ObjectId[];

  // Người tạo ra company (recruiter)
  @Prop({ type: Types.ObjectId, ref: 'Recruiter', required: true })
  createdBy: Types.ObjectId;

  // Liên kết Job
  @Prop({ type: [Types.ObjectId], ref: 'Job', default: [] })
  jobs: Types.ObjectId[];

  // Gói đăng tin hiện tại
  @Prop({ type: Types.ObjectId, ref: 'JobPackage', default: null })
  currentJobPackageId?: Types.ObjectId | null;

  // Thời điểm hết hạn gói
  @Prop({ type: Date, default: null })
  packageExpireAt?: Date | null;

  // Số lượng bài đăng còn lại trong kỳ
  @Prop({ type: Number, default: 0 })
  remainingJobPosts?: number;
}

export const CompanySchema = SchemaFactory.createForClass(Company);