import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationDto {
  @IsBoolean()
  @IsOptional()
  readonly isRead?: boolean;

  @IsString()
  @IsOptional()
  readonly message?: string;
}
