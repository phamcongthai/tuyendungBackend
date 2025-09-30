import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsIn } from 'class-validator';
import { NotificationType } from '../notifications.schema';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  readonly userId: string;

  @IsString()
  @IsNotEmpty()
  readonly message: string;

  @IsOptional()
  @IsEnum(NotificationType)
  readonly type?: NotificationType;

  @IsOptional()
  @IsString()
  readonly applicationId?: string;

  @IsOptional()
  @IsString()
  readonly jobId?: string;

  @IsOptional()
  @IsString()
  readonly applicantId?: string;

  @IsOptional()
  @IsObject()
  readonly metadata?: any;

  @IsOptional()
  @IsIn(['recruiter', 'client', 'both'])
  readonly audience?: 'recruiter' | 'client' | 'both';
}
