import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BannerOrderDocument = BannerOrder & Document;

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

@Schema({ timestamps: true, collection: 'banner_orders' })
export class BannerOrder {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId; // recruiter account id

  @Prop({ type: Types.ObjectId, ref: 'Recruiter', required: true })
  recruiterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BannerPackage', required: true })
  packageId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number; // VND

  @Prop({ type: String, enum: ['vnpay'], default: 'vnpay' })
  paymentMethod: 'vnpay';

  @Prop({ type: String, enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'], default: 'PENDING' })
  status: PaymentStatus;

  // Payment gateway refs
  @Prop({ type: String, default: '' })
  gatewayTxnRef: string; // vnp_TxnRef

  @Prop({ type: Object, default: {} })
  gatewayMeta: Record<string, any>;

  // Banner draft info captured at purchase
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  imageUrl: string;

  @Prop({ type: String, default: '' })
  redirectUrl: string;

  @Prop({ type: String, default: '' })
  altText: string;

  // Resulting banner id after payment (created pending approval)
  @Prop({ type: Types.ObjectId, ref: 'Banner', default: null })
  bannerId: Types.ObjectId | null;
}

export const BannerOrderSchema = SchemaFactory.createForClass(BannerOrder);

// Lightweight intent to avoid creating order before payment success
export type PaymentIntentDocument = PaymentIntent & Document;

@Schema({ timestamps: true, collection: 'banner_order_intents' })
export class PaymentIntent {
  @Prop({ type: String, required: true, index: true })
  gatewayTxnRef: string; // vnp_TxnRef

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Recruiter', required: true })
  recruiterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BannerPackage', required: true })
  packageId: Types.ObjectId;

  // Draft banner data
  @Prop({ type: String, required: true })
  title: string;
  @Prop({ type: String, required: true })
  imageUrl: string;
  @Prop({ type: String, default: '' })
  redirectUrl: string;
  @Prop({ type: String, default: '' })
  altText: string;
}

export const PaymentIntentSchema = SchemaFactory.createForClass(PaymentIntent);

// ================= JOB FEATURE ORDERS =================

export type JobFeatureOrderDocument = JobFeatureOrder & Document;

@Schema({ timestamps: true, collection: 'job_feature_orders' })
export class JobFeatureOrder {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Recruiter', required: true })
  recruiterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  jobId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobPackage', required: true })
  packageId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number; // VND

  @Prop({ type: String, enum: ['vnpay'], default: 'vnpay' })
  paymentMethod: 'vnpay';

  @Prop({ type: String, enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'], default: 'PENDING' })
  status: PaymentStatus;

  @Prop({ type: String, default: '' })
  gatewayTxnRef: string; // vnp_TxnRef

  @Prop({ type: Object, default: {} })
  gatewayMeta: Record<string, any>;
}

export const JobFeatureOrderSchema = SchemaFactory.createForClass(JobFeatureOrder);

export type JobFeatureIntentDocument = JobFeatureIntent & Document;

@Schema({ timestamps: true, collection: 'job_feature_order_intents' })
export class JobFeatureIntent {
  @Prop({ type: String, required: true, index: true })
  gatewayTxnRef: string; // vnp_TxnRef

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Recruiter', required: true })
  recruiterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  jobId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobPackage', required: true })
  packageId: Types.ObjectId;
}

export const JobFeatureIntentSchema = SchemaFactory.createForClass(JobFeatureIntent);


