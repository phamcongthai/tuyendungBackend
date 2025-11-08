import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HollandQuestionDocument = HollandQuestion & Document;

@Schema({ timestamps: true, collection: 'holland_questions' })
export class HollandQuestion {
  @Prop({ required: true })
  order: number;

  @Prop({ required: true })
  content: string;

  @Prop({ 
    required: true, 
    enum: ['R', 'I', 'A', 'S', 'E', 'C'],
    type: String 
  })
  category: string; // R: Realistic, I: Investigative, A: Artistic, S: Social, E: Enterprising, C: Conventional

  @Prop({
    type: [{ label: String, value: Number }],
    default: [
      { label: 'Rất không thích', value: 0 },
      { label: 'Không thích', value: 1 },
      { label: 'Bình thường', value: 2 },
      { label: 'Thích', value: 3 },
      { label: 'Rất thích', value: 4 }
    ]
  })
  options: { label: string; value: number }[];

  @Prop({ default: false })
  deleted: boolean;
}

export const HollandQuestionSchema = SchemaFactory.createForClass(HollandQuestion);
