import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CvSample } from '../../cv_sample/schemas/cv-sample.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true, unique: true })
  accountId: Types.ObjectId; // liên kết đến tài khoản đăng nhập

  @Prop({ default: null })
  avatar: string;

  // Ngày sinh
  @Prop({ default: null })
  dateOfBirth: Date;

  // Giới tính: male, female, other
  @Prop({ enum: ['male', 'female', 'other'], default: 'other' })
  gender: string;

  // Tỉnh / thành phố
  @Prop({ default: null })
  city: string;

  // Vị trí mong muốn (VD: Java Developer, Data Analyst)
  @Prop({ default: null })
  desiredPosition: string;

  // Kinh nghiệm tổng quát (VD: "3 năm Java Developer")
  @Prop({ default: null })
  summaryExperience: string;

  // Danh sách kỹ năng nổi bật
  @Prop({ type: [String], default: [] })
  skills: string[];

  // CV template ID reference
  @Prop({ type: Types.ObjectId, ref: 'CvSample', default: null })
  cvId: Types.ObjectId | CvSample;

  // CV fields data (simple key-value pairs for template fields)
  @Prop({ type: Object, default: {} })
  cvFields: Record<string, string>;

  @Prop({ default: null })
  cvPdfUrl: string;

  // Holland Test Score
  @Prop({
    type: {
      R: { type: Number, default: 0 },
      I: { type: Number, default: 0 },
      A: { type: Number, default: 0 },
      S: { type: Number, default: 0 },
      E: { type: Number, default: 0 },
      C: { type: Number, default: 0 }
    },
    default: null
  })
  hollandScore: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  } | null;

  // Holland Type (top 3 categories)
  @Prop({ default: null })
  hollandType: string; // ví dụ: "A-S-E"
}

export const UserSchema = SchemaFactory.createForClass(User);
