import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type JobCategoriesDocument = JobCategories & Document;

export enum JobCategoriesStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({ timestamps: true })
export class JobCategories {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description: string;

  @Prop({ enum: JobCategoriesStatus, default: JobCategoriesStatus.ACTIVE })
  status: JobCategoriesStatus;

  @Prop({ default: 0 })
  views: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Recruiter' })
  recruiterId: MongooseSchema.Types.ObjectId;

  @Prop({ default: false })
  deleted: boolean;  // Thêm trường deleted để soft delete
}

export const JobCategoriesSchema = SchemaFactory.createForClass(JobCategories);
