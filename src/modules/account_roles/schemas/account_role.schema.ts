import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccountRolesDocument = AccountRole & Document;

@Schema({ timestamps: true })
export class AccountRole extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId;
}

export const AccountRoleSchema = SchemaFactory.createForClass(AccountRole);

// Add compound index to ensure uniqueness and improve query performance
AccountRoleSchema.index({ accountId: 1, roleId: 1 }, { unique: true });
AccountRoleSchema.index({ accountId: 1 });
AccountRoleSchema.index({ roleId: 1 });
