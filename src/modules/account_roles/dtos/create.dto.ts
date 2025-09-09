import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountRoleDto {
  @ApiProperty({ 
    description: 'Account ID (MongoDB ObjectId)', 
    example: '507f1f77bcf86cd799439011' 
  })
  @IsNotEmpty()
  accountId: Types.ObjectId;

  @ApiProperty({ 
    description: 'Role ID (MongoDB ObjectId)', 
    example: '507f1f77bcf86cd799439012' 
  })
  @IsNotEmpty()
  roleId: Types.ObjectId;
}