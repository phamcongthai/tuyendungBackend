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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ 
    description: 'Job title', 
    example: 'Frontend Developer' 
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Job description', 
    example: 'We are looking for an experienced Frontend Developer...' 
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({ 
    description: 'Job requirements (string)', 
    example: '2+ years experience with React, Knowledge of TypeScript, Experience with REST APIs'
  })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ 
    description: 'Job benefits (string)', 
    example: 'Health insurance, Flexible hours, Remote work'
  })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional({ 
    description: 'Required skills (array of strings)', 
    example: ['React', 'TypeScript', 'Node.js'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ 
    description: 'Job type', 
    enum: JobType,
    example: JobType.FULLTIME
  })
  @IsEnum(JobType)
  jobType: JobType;

  @ApiProperty({ 
    description: 'Working mode', 
    enum: WorkingMode,
    example: WorkingMode.HYBRID
  })
  @IsEnum(WorkingMode)
  workingMode: WorkingMode;

  @ApiPropertyOptional({ 
    description: 'Job location', 
    example: 'Ha Noi' 
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ 
    description: 'Minimum salary', 
    example: 15000000 
  })
  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum salary', 
    example: 25000000 
  })
  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @ApiPropertyOptional({ 
    description: 'Currency (VND or USD)', 
    example: 'VND',
    enum: ['VND', 'USD']
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ 
    description: 'Application deadline', 
    example: '2024-12-31T23:59:59.000Z' 
  })
  @IsOptional()
  @IsDateString()
  deadline?: Date;

  @ApiPropertyOptional({ 
    description: 'Job status', 
    enum: JobStatus,
    example: JobStatus.DRAFT 
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ 
    description: 'Recruiter ID who created this job (auto-assigned from JWT token)', 
    example: '507f1f77bcf86cd799439011' 
  })
  @IsOptional()
  @IsMongoId()
  recruiterId?: Types.ObjectId;

  @ApiPropertyOptional({ 
    description: 'Company ID for this job (auto-assigned from JWT token)', 
    example: '507f1f77bcf86cd799439012' 
  })
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
