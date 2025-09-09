import { IsString, IsOptional, IsUrl, IsEmail, IsArray, ArrayNotEmpty, ValidateIf } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string; // Tên công ty (bắt buộc)

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateIf((o) => o.logo && o.logo.trim() !== '')
  @IsUrl({}, { message: 'Logo must be a valid URL address' })
  @IsString()
  logo?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @IsOptional()
  @IsString()
  size?: string;
}
