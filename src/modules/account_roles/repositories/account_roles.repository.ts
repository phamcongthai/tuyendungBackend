import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccountRole, AccountRolesDocument } from '../schemas/account_role.schema';
import { CreateAccountRoleDto } from '../dtos/create.dto';
import { UpdateAccountRoleDto } from '../dtos/update.dto';
import { RolesDocument } from 'src/modules/roles/schemas/roles.schemas';
@Injectable()
export class AccountRolesRepository {
  constructor(
    @InjectModel(AccountRole.name) 
    private readonly accountRolesModel: Model<AccountRolesDocument>,
  ) {}

  // [GET] /admin/account-roles
  async findAll(): Promise<AccountRole[]> {
    return this.accountRolesModel.find().exec();
  }

  // [GET] /admin/account-roles/:accountId
  async findByAccountId(accountId: Types.ObjectId): Promise<AccountRole[]> {
    return this.accountRolesModel.find({ accountId }).exec();
  }

  // [GET] /admin/account-roles/:accountId/:roleId
  async findOne(accountId: Types.ObjectId, roleId: Types.ObjectId): Promise<AccountRole> {
    const record = await this.accountRolesModel.findOne({ accountId, roleId }).exec();
    if (!record) throw new NotFoundException('AccountRole not found');
    return record;
  }

  // [POST] /admin/account-roles/create
  async create(createDto: CreateAccountRoleDto): Promise<AccountRole> {
    // ⚠️ Lưu ý: createDto.accountId & createDto.roleId đã được convert thành ObjectId ở controller
    const exists = await this.accountRolesModel.findOne({
      accountId: createDto.accountId,
      roleId: createDto.roleId,
    });
    if (exists) throw new BadRequestException('Role already assigned to account');

    return this.accountRolesModel.create(createDto);
  }

  // [PATCH] /admin/account-roles/:accountId/:roleId
  async update(
    accountId: Types.ObjectId,
    roleId: Types.ObjectId,
    updateDto: UpdateAccountRoleDto,
  ): Promise<AccountRole> {
    const updated = await this.accountRolesModel.findOneAndUpdate(
      { accountId, roleId },
      updateDto,
      { new: true, runValidators: true },
    ).exec();

    if (!updated) throw new NotFoundException('AccountRole not found');
    return updated;
  }

  // [DELETE] /admin/account-roles/deleteMany/:accountId
  async deleteByAccountId(accountId: Types.ObjectId): Promise<number> {
    const result = await this.accountRolesModel.deleteMany({ accountId }).exec();
    return result.deletedCount ?? 0;
  }

  // [DELETE] /admin/account-roles/deleteOne/:accountId/:roleId
  async deleteOne(accountId: Types.ObjectId, roleId: Types.ObjectId): Promise<void> {
    const result = await this.accountRolesModel.deleteOne({ accountId, roleId }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('AccountRole not found');
    }
  }
  async findRolesByAccountId(accountId: Types.ObjectId): Promise<string[]> {
    const accRoles = await this.accountRolesModel
      .find({ accountId })
      .populate<{ roleId: RolesDocument }>('roleId', 'name'); 

    return accRoles.map((r) => r.roleId.name); 
}
};
