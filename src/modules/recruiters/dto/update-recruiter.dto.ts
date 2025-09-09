import { IsOptional, IsString, IsEnum, IsMongoId, IsBoolean } from 'class-validator';
import { Gender, CompanyRole } from '../schemas/recruiter.schema';
import { Types } from 'mongoose';

export class UpdateRecruiterDto {
  @IsOptional()
  @IsMongoId()
  companyId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
