import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BannerPosition } from '../../banners/enums/banner-position.enum';

export type BannerPackageDocument = BannerPackage & Document;

@Schema({ timestamps: true, collection: 'banner_packages' })
export class BannerPackage {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, default: '' })
  description?: string;

  @Prop({ type: String, enum: BannerPosition, required: true })
  position: BannerPosition;

  @Prop({ type: String, default: '' })
  previewImage?: string;

  @Prop({ type: Number, required: true, default: 7, min: 1 })
  durationDays: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  price: number;

  @Prop({ type: Number, required: true, default: 1, min: 1 })
  maxBannerSlots: number;

  @Prop({ type: Number, default: 1, min: 0 })
  priority: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const BannerPackageSchema = SchemaFactory.createForClass(BannerPackage);








