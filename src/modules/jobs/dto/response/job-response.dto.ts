import { Expose, Type, Transform } from 'class-transformer';
import { JobType, WorkingMode, JobStatus } from '../../jobs.schema';

export class JobCategoryResponseDto {
  @Expose()
  _id: string;

  @Expose()
  title: string;

  @Expose()
  slug: string;

  @Expose()
  description?: string;
}

export class CompanyResponseDto {
  @Expose()
  _id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  logo?: string;

  @Expose()
  size?: string;

  @Expose()
  address?: string;

  @Expose()
  industries?: string[];

  @Expose()
  website?: string;

  @Expose()
  description?: string;

  @Expose()
  foundedYear?: string;
}

export class JobResponseDto {
  @Expose()
  _id: string;

  @Expose()
  slug: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  requirements: string;

  @Expose()
  benefits: string;

  @Expose()
  skills: string[];

  @Expose()
  jobType: JobType;

  @Expose()
  workingMode: WorkingMode;

  @Expose()
  location?: string;

  // Career (category title) derived from populated jobCategoryId
  @Expose()
  @Transform(({ obj }) => (obj?.jobCategoryId?.title || obj?.jobCategory?.title || undefined))
  career?: string;

  @Expose()
  salaryMin?: number;

  @Expose()
  salaryMax?: number;

  @Expose()
  isSalaryNegotiable?: boolean;

  @Expose()
  currency: string;

  @Expose()
  deadline?: Date;

  @Expose()
  status: JobStatus;

  @Expose()
  recruiterId: string;

  @Expose()
  @Type(() => CompanyResponseDto)
  companyId: string | CompanyResponseDto;

  // Map the populated jobCategoryId to jobCategory in response
  @Expose({ name: 'jobCategoryId' })
  @Type(() => JobCategoryResponseDto)
  jobCategory?: JobCategoryResponseDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // Number of applications for this job (computed server-side)
  @Expose()
  applicationCount?: number;
}