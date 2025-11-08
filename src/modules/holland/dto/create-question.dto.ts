import { IsString, IsNumber, IsEnum, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OptionDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsNumber()
  value: number;
}

export class CreateQuestionDto {
  @ApiProperty()
  @IsNumber()
  order: number;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ enum: ['R', 'I', 'A', 'S', 'E', 'C'] })
  @IsEnum(['R', 'I', 'A', 'S', 'E', 'C'])
  category: string;

  @ApiProperty({ type: [OptionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];
}

export class UpdateQuestionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ enum: ['R', 'I', 'A', 'S', 'E', 'C'], required: false })
  @IsOptional()
  @IsEnum(['R', 'I', 'A', 'S', 'E', 'C'])
  category?: string;

  @ApiProperty({ type: [OptionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];
}
