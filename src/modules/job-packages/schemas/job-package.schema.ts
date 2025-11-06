import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobPackageDocument = JobPackage & Document;

@Schema({ timestamps: true, collection: 'job_packages' })
export class JobPackage {
  @Prop({ type: String, required: true, trim: true, index: true, unique: true })
  packageName: string;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  price: number;

  @Prop({ type: Number, required: true, default: 30, min: 1 })
  durationDays: number;

  @Prop({
    type: {
      jobPostLimit: { type: Number, default: 1, min: 0 },
      autoApprove: { type: Boolean, default: false },
      highlight: { type: Boolean, default: false },
      showOnHomepage: { type: Boolean, default: false },
      analyticsAccess: { type: Boolean, default: false },
      supportLevel: {
        type: String,
        enum: ['none', 'email', 'hotline', 'priority'],
        default: 'none',
      },
    },
    default: {},
  })
  features: {
    jobPostLimit?: number;
    autoApprove?: boolean;
    highlight?: boolean;
    showOnHomepage?: boolean;
    analyticsAccess?: boolean;
    supportLevel?: 'none' | 'email' | 'hotline' | 'priority';
  };

  @Prop({ type: Number, default: 1, min: 0 })
  priorityLevel: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const JobPackageSchema = SchemaFactory.createForClass(JobPackage);







