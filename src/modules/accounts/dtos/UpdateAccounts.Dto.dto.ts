import { IsEmail, IsOptional, IsString, IsMongoId, IsEnum, IsDate, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '../enums/accounts.enum';

export class UpdateAccountsDto {
  @ApiProperty({ 
    description: 'User email address',
    example: 'user@example.com',
    required: false 
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    description: 'New password (plain). Will be hashed on server',
    required: false 
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ 
    description: 'Role IDs to assign to the account',
    example: '507f1f77bcf86cd799439011',
    required: false 
  })
  @IsOptional()
  roleIds?: string[];

  @ApiProperty({ 
    description: 'Account status',
    enum: AccountStatus,
    required: false 
  })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @ApiProperty({ 
    description: 'Email verified flag',
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({ 
    description: 'Last login timestamp',
    required: false 
  })
  @IsDate()
  @IsOptional()
  lastLoginAt?: Date;
}
