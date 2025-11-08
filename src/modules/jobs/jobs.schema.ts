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
  requirements: string;

  @Prop({ type: String, default: '' })
  benefits: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ type: String, enum: JobType, required: true })
  jobType: JobType;

  @Prop({ type: String, enum: WorkingMode, required: true })
  workingMode: WorkingMode;

  @Prop({ trim: true })
  location: string;

  @Prop({ type: Number })
  salaryMin?: number;

  @Prop({ type: Number })
  salaryMax?: number;

  @Prop({ type: Boolean, default: false })
  isSalaryNegotiable?: boolean;

  @Prop({ type: String, enum: ['VND', 'USD'], default: 'VND' })
  currency: string;

  @Prop({ type: Number, default: 1 })
  headcount?: number;

  @Prop({ type: String, default: '' })
  levelVi?: string;

  @Prop({ type: String, default: '' })
  levelEn?: string;

  @Prop({ type: String, default: '' })
  education?: string;

  @Prop({ type: Date })
  deadline?: Date;

  @Prop({ type: String, enum: JobStatus, default: JobStatus.DRAFT })
  status: JobStatus;

  @Prop({ default: false })
  deleted: boolean;

  // recruiterId thực ra lưu accountId của recruiter
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  recruiterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobCategories' })
  jobCategoryId?: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isFeatured?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'JobPackage', default: null })
  featuredPackageId?: Types.ObjectId | null;
}

export const JobSchema = SchemaFactory.createForClass(Job);
