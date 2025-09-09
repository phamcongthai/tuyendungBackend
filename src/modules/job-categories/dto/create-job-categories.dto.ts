// create-job-category.dto.ts
import { IsString, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { JobCategoriesStatus } from '../job-categories.schema';

export class CreateJobCategoryDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(JobCategoriesStatus)
  status?: JobCategoriesStatus;

  @IsOptional()
  @IsMongoId()
  recruiterId?: string;
}
