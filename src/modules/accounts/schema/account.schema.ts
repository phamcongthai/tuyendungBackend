import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AccountStatus } from '../enums/accounts.enum';

export type AccountsDocument = Account & Document;

@Schema({ timestamps: true })
export class Account extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop()
  password: string; // có thể null nếu login bằng Google

  @Prop()
  phone: string;
  
  @Prop()
  fullName: string;
  
  // status: ACTIVE / INACTIVE
  @Prop({
    type: String,
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,   
  })
  status: AccountStatus;

  // Xác thực email hay phone (nếu cần)
  @Prop({ default: false })
  isVerified: boolean;

  // Lần đăng nhập cuối
  @Prop({ default: null })
  lastLoginAt: Date;

  // Đánh dấu xóa mềm
  @Prop({ default: false })
  deleted: boolean;

  // Chấp nhận điều khoản
  @Prop({ default: false })
  agreement: boolean;

  // Provider: local | google | facebook...
  @Prop({ default: 'local' })
  provider: string;

  // ProviderId: id unique từ Google/Facebook (sub)
  @Prop({ default: null })
  providerId: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
