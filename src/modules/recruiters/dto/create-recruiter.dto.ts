// create-recruiter.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';
import { Gender, CompanyRole } from '../schemas/recruiter.schema';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateRecruiterDto {
  @IsMongoId()
  @IsNotEmpty()
  companyId: Types.ObjectId;

  @IsOptional()
  @IsString()
  position?: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEnum(CompanyRole)
  companyRole?: CompanyRole;
}
