import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HollandResultDocument = HollandResult & Document;

@Schema({ timestamps: true, collection: 'holland_results' })
export class HollandResult {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId;

  @Prop({
    type: {
      R: { type: Number, default: 0 },
      I: { type: Number, default: 0 },
      A: { type: Number, default: 0 },
      S: { type: Number, default: 0 },
      E: { type: Number, default: 0 },
      C: { type: Number, default: 0 }
    },
    required: true
  })
  scores: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };

  @Prop({ required: true })
  topCode: string; // ví dụ: "A-S-E"

  @Prop({ type: Object, default: null })
  answers: Record<string, number>; // { questionId: selectedValue }
}

export const HollandResultSchema = SchemaFactory.createForClass(HollandResult);

// Index để tìm kết quả theo user
HollandResultSchema.index({ accountId: 1, createdAt: -1 });
