import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type EmailVerificationDocument = EmailVerification & Document;
@Schema({ timestamps: true })
export class EmailVerification extends Document {
  @Prop({ required: true })
  accountId: string;  

  @Prop({ required: true })
  token: string;  

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);
