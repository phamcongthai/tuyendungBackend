import { Expose } from 'class-transformer';

export class UserProfileDto {
  @Expose()
  _id: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  role: string;

  @Expose()
  avatar?: string;

  @Expose()
  phone?: string;

  @Expose()
  address?: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
