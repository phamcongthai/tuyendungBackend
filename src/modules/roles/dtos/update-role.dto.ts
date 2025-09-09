import {  IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RolesStatus } from '../enums/roles.enum';

export class UpdateRolesDto {
  @IsNotEmpty()
  @IsString()
  name : string;

  @IsNotEmpty()
  @IsArray()
  permissions : string[];

  @IsOptional()
  @IsEnum(RolesStatus)
  isActive? : RolesStatus; 

  @IsOptional()
  @IsBoolean()
  deleted?: boolean;

}
