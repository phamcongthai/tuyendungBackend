import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  suitableCareers?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  suggestedSkills?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;
}

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  suitableCareers?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  suggestedSkills?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;
}
