import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobDocument = Job & Document;

export enum JobType {
  FULLTIME = 'fulltime',
  PARTTIME = 'parttime',
  INTERNSHIP = 'internship',
  CONTRACT = 'contract',
  FREELANCE = 'freelance',
}

export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

export enum WorkingMode {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

@Schema({ timestamps: true, collection: 'jobs' })
export class Job {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, trim: true })
  title: string; // Tên vị trí (VD: Backend Developer)

  @Prop({ required: true })
  description: string; // Mô tả công việc chi tiết

  @Prop({ type: String, default: '' })
  requirements: string; // Yêu cầu ứng viên

  @Prop({ type: String, default: '' })
  benefits: string; // Quyền lợi

  @Prop({ type: [String], default: [] })
  skills: string[]; // Kỹ năng cần có

  @Prop({ type: String, enum: JobType, required: true })
  jobType: JobType; // Loại công việc

  @Prop({ type: String, enum: WorkingMode, required: true })
  workingMode: WorkingMode; // Hình thức làm việc

  @Prop({ trim: true })
  location: string; // Địa điểm làm việc

  @Prop({ type: Number })
  salaryMin?: number; // Mức lương tối thiểu

  @Prop({ type: Number })
  salaryMax?: number; // Mức lương tối đa

  @Prop({ type: String, enum: ['VND', 'USD'], default: 'VND' })
  currency: string; // Đơn vị tiền tệ

  @Prop({ type: Date })
  deadline?: Date; // Hạn nộp hồ sơ

  @Prop({ type: String, enum: JobStatus, default: JobStatus.DRAFT })
  status: JobStatus; // Trạng thái tin: draft | active | expired

  @Prop({ default: false })
  deleted: boolean; // Đánh dấu xóa mềm

  // Job thuộc Recruiter nào
  @Prop({ type: Types.ObjectId, ref: 'Recruiter', required: true })
  recruiterId: Types.ObjectId;

  // Job thuộc Company nào
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  // Job thuộc Category nào
  @Prop({ type: Types.ObjectId, ref: 'JobCategories' })
  jobCategoryId?: Types.ObjectId;
}

export const JobSchema = SchemaFactory.createForClass(Job);
