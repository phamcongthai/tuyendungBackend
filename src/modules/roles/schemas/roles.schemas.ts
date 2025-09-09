import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RolesStatus } from '../enums/roles.enum';

export type RolesDocument = Role & Document;
@Schema({ timestamps: true })
export class Role extends Document {
  @Prop({ required: true, unique: true })
  name: string; 

  @Prop({ type: [String], default: [] })
  permissions: string[]; 

  @Prop({
      type: String,
      enum: RolesStatus,
      default: RolesStatus.ACTIVE,   // 👈 mặc định ACTIVE
    })
    status: RolesStatus;

  @Prop({ default: false})
  deleted: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
