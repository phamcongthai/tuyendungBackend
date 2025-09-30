import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlogDocument = Blog & Document;

@Schema({ collection: 'blogs', timestamps: true })
export class Blog {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  slug: string;

  @Prop({ type: String, default: '' })
  excerpt: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  coverImageUrl: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Boolean, default: false })
  published: boolean;

  @Prop({ type: Date, default: null })
  publishedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Account', default: null })
  createdBy?: Types.ObjectId | null;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.index({ slug: 1 }, { unique: true });

