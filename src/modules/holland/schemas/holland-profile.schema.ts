import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HollandProfileDocument = HollandProfile & Document;

@Schema({ timestamps: true, collection: 'holland_profiles' })
export class HollandProfile {
  @Prop({ required: true, unique: true })
  code: string; // ví dụ: "A-S-E", "R-I-C"

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  suitableCareers: string[];

  @Prop({ type: [String], default: [] })
  suggestedSkills: string[];

  @Prop({ default: null })
  image: string;

  @Prop({ default: false })
  deleted: boolean;
}

export const HollandProfileSchema = SchemaFactory.createForClass(HollandProfile);
