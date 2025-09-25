import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Types } from 'mongoose';
import { JobType, WorkingMode, JobStatus } from '../../jobs.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateJobDto {
  @ApiPropertyOptional({ description: 'Job title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Job requirements (string)'
  })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ 
    description: 'Job benefits (string)'
  })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional({ 
    description: 'Required skills (array of strings)', 
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ 
    description: 'Job type', 
    enum: JobType
  })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiPropertyOptional({ 
    description: 'Working mode', 
    enum: WorkingMode
  })
  @IsOptional()
  @IsEnum(WorkingMode)
  workingMode?: WorkingMode;

  @ApiPropertyOptional({ description: 'Job location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Minimum salary' })
  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Maximum salary' })
  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @ApiPropertyOptional({ 
    description: 'Currency (VND or USD)',
    enum: ['VND', 'USD']
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Application deadline' })
  @IsOptional()
  @IsDateString()
  deadline?: Date;

  @ApiPropertyOptional({ description: 'Job status', enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Recruiter ID' })
  @IsOptional()
  @IsMongoId()
  recruiterId?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsMongoId()
  companyId?: Types.ObjectId;

  @ApiPropertyOptional({ 
    description: 'Job category ID', 
    example: '507f1f77bcf86cd799439013' 
  })
  @IsOptional()
  @IsMongoId()
  jobCategoryId?: Types.ObjectId;
}
