import { IsEmail, IsNotEmpty, IsString, IsMongoId, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '../enums/accounts.enum';

export class CreateAccountsDto {
  @ApiProperty({ 
    description: 'User email address', 
    example: 'user@example.com' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'User password', 
    example: 'password123' 
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ 
    description: 'Role ID to assign to the account', 
    example: '507f1f77bcf86cd799439011' 
  })
  @IsMongoId()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({ 
    description: 'Account status', 
    enum: AccountStatus,
    required: false,
    default: AccountStatus.ACTIVE 
  })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @ApiProperty({ 
    description: 'Last login timestamp', 
    required: false 
  })
  @IsOptional()
  lastLoginAt?: Date;
}
