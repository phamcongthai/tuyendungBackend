import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationDocument = Application & Document;

@Schema({ 
  timestamps: true, 
  collection: 'applications',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  jobId: Types.ObjectId;   // tham chiếu đến Job

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId; // tham chiếu đến Account đăng nhập

  @Prop({
    type: String,
    enum: ['pending', 'viewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn', 'interviewed', 'interview_failed'],
    default: 'pending',
  })
  status: string;  // trạng thái xử lý của recruiter

  @Prop({ default: null })
  note?: string;   // recruiter có thể ghi chú thêm

  @Prop({ default: null })
  coverLetter?: string;   // thư xin việc của ứng viên

  // Quan tâm (tách riêng khỏi status)
  @Prop({ type: Boolean, default: false })
  interested?: boolean;

  // Thông tin phỏng vấn
  @Prop({ type: Date, default: null })
  interviewDate?: Date | null;

  @Prop({ type: String, default: null })
  interviewLocation?: string | null;

  @Prop({ type: String, default: null })
  interviewNote?: string | null;

}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

// Virtual populate: resolve User profile via accountId
ApplicationSchema.virtual('userProfile', {
  ref: 'User',
  localField: 'accountId',
  foreignField: 'accountId',
  justOne: true,
});

// Virtual populate: resolve Account basic info
ApplicationSchema.virtual('account', {
  ref: 'Account',
  localField: 'accountId',
  foreignField: '_id',
  justOne: true,
});
