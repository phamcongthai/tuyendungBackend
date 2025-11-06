import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BannerPosition } from '../enums/banner-position.enum';

export type BannerDocument = Banner & Document;

@Schema({ timestamps: true, collection: 'banners' })
export class Banner {
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true })
  imageUrl: string;

  @Prop({ type: String, default: '' })
  redirectUrl: string;

  @Prop({ type: String, default: '' })
  altText: string;

  // Link to package and position
  @Prop({ type: Types.ObjectId, ref: 'BannerPackage', required: true })
  packageId: Types.ObjectId;

  @Prop({ type: String, enum: BannerPosition, required: true })
  position: BannerPosition;

  // Price snapshot
  @Prop({ type: Number, default: 0, min: 0 })
  price: number;

  // Creator links
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Recruiter', required: true })
  recruiterId: Types.ObjectId;

  // Schedule
  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  // Moderation & status
  @Prop({ type: Boolean, default: false })
  approved: boolean;

  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop({ type: String, default: null })
  rejectedReason: string | null;

  // Metrics
  @Prop({ type: Number, default: 0, min: 0 })
  viewCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  clickCount: number;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);


