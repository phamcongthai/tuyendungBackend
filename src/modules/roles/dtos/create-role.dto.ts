import {  IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RolesStatus } from '../enums/roles.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRolesDto {
  @ApiProperty({ 
    description: 'Role name', 
    example: 'Admin' 
  })
  @IsNotEmpty()
  @IsString()
  name : string;

  @ApiProperty({ 
    description: 'Array of permission strings assigned to this role', 
    example: ['create_user', 'read_user', 'update_user', 'delete_user'],
    type: [String] 
  })
  @IsNotEmpty()
  @IsArray()
  permissions : string[];

  @ApiPropertyOptional({ 
    description: 'Role status', 
    enum: RolesStatus,
    example: RolesStatus.ACTIVE 
  })
  @IsOptional()
  @IsEnum(RolesStatus)
  isActive? : RolesStatus; 

  @ApiPropertyOptional({ 
    description: 'Whether role is deleted', 
    example: false 
  })
  @IsOptional()
  @IsBoolean()
  deleted?: boolean;

}
