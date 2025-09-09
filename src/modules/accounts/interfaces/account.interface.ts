import { Account } from '../schema/account.schema';
import { AccountStatus } from '../enums/accounts.enum';

export interface AccountWithRoles {
  _id: string;
  email: string;
  password: string;
  status: AccountStatus;
  isVerified: boolean;
  lastLoginAt: Date | null;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  roleNames: string[];
}
