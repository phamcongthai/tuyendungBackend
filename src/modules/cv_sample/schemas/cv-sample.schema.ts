import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CvSampleDocument = CvSample & Document;

@Schema({ timestamps: true })
export class CvSample {
  @Prop({ required: true })
  html: string; // Nội dung HTML của CV mẫu

  @Prop({ required: true })
  css: string; // CSS cho CV mẫu

  @Prop({ required: true })
  name: string; // Tên CV mẫu

  @Prop({ required: true })
  title: string; // Tiêu đề CV mẫu

  @Prop({ required: false })
  description: string; // Mô tả CV mẫu

  @Prop({ required: false })
  demoImage: string; // URL hình ảnh demo của CV mẫu

  @Prop({ default: true })
  isActive: boolean; // Trạng thái hoạt động

  @Prop({ default: false })
  isDeleted: boolean; // Xóa mềm
}

export const CvSampleSchema = SchemaFactory.createForClass(CvSample);
