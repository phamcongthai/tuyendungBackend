import { IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateAccountRoleDto {
  @IsOptional()
  roleId?: Types.ObjectId;
}