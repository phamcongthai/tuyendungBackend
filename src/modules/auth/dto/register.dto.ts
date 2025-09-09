import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../../common/decorators/match.decorator';
import { PasswordComplexity } from '../../../common/decorators/passwordComplexity.decorator';
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}
export class RegisterForUserDto {
  @ApiProperty()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @PasswordComplexity()
  password: string;

  @ApiProperty()
  @Match('password', 'Mật khẩu xác nhận không khớp')
  confirmPassword: string;

  @ApiProperty()
  @IsBoolean()
  agreement: boolean;

}
export class RegisterForRecruiterDto {
  @ApiProperty()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @PasswordComplexity()
  password: string;

  @ApiProperty()
  @Match('password', 'Mật khẩu xác nhận không khớp')
  confirmPassword: string;

  @ApiProperty()
  @IsBoolean()
  agreement: boolean;

  @ApiProperty()
  @IsString()
  phone: string;
}
