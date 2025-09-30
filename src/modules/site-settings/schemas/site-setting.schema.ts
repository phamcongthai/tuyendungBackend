import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SiteSettingDocument = SiteSetting & Document;

@Schema({ collection: 'site_settings', timestamps: true })
export class SiteSetting {
  @Prop({ type: String, default: 'site' })
  key: string; // constant key to ensure single document

  @Prop({ type: String, default: '' })
  logoUrl: string;

  @Prop({ type: String, default: '' })
  faviconUrl: string;

  // Site names
  @Prop({ type: String, default: 'TopJobs' })
  clientSiteName: string;

  @Prop({ type: String, default: 'ThaiCV Recruiter' })
  recruiterSiteName: string;

  // Page titles
  @Prop({ type: String, default: '' })
  clientTitle: string;

  @Prop({ type: String, default: '' })
  recruiterTitle: string;

  // Global notice controlled by admin
  @Prop({ type: Boolean, default: false })
  noticeEnabled: boolean;

  @Prop({ type: String, default: '' })
  noticeMessage: string;

  @Prop({ type: String, default: '#1677ff' })
  noticeColor: string; // background color

  @Prop({ type: Types.ObjectId, ref: 'Account', default: null })
  updatedBy?: Types.ObjectId | null;
}

export const SiteSettingSchema = SchemaFactory.createForClass(SiteSetting);

SiteSettingSchema.index({ key: 1 }, { unique: true });
