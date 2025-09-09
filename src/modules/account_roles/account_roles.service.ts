import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AccountRolesRepository } from './repositories/account_roles.repository';
import { CreateAccountRoleDto } from './dtos/create.dto';
import { UpdateAccountRoleDto } from './dtos/update.dto';
import { AccountRole } from './schemas/account_role.schema';

@Injectable()
export class AccountRolesService {
  constructor(private readonly repo: AccountRolesRepository) {}

  findAll(): Promise<AccountRole[]> {
    return this.repo.findAll();
  }

  findByAccount(accountId: Types.ObjectId): Promise<AccountRole[]> {
    return this.repo.findByAccountId(accountId);
  }

  findOne(accountId: Types.ObjectId, roleId: Types.ObjectId): Promise<AccountRole> {
    return this.repo.findOne(accountId, roleId);
  }

  create(dto: CreateAccountRoleDto): Promise<AccountRole> {
    return this.repo.create(dto);
  }

  update(
    accountId: Types.ObjectId,
    roleId: Types.ObjectId,
    dto: UpdateAccountRoleDto,
  ): Promise<AccountRole> {
    return this.repo.update(accountId, roleId, dto);
  }

  deleteOne(accountId: Types.ObjectId, roleId: Types.ObjectId) {
    return this.repo.deleteOne(accountId, roleId);
  }

  deleteMany(accountId: Types.ObjectId) {
    return this.repo.deleteByAccountId(accountId);
  }
}
