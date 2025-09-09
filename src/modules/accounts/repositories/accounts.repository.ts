import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountsDocument } from '../schema/account.schema';
import * as bcrypt from 'bcrypt';
import { buildNameSearchQuery } from 'src/utils/buildSearchQuery';
import { AccountStatus } from '../enums/accounts.enum';
import { CreateAccountsDto } from '../dtos/CreateAccountsDto.dto';
import { UpdateAccountsDto } from '../dtos/UpdateAccounts.Dto.dto';
import { RegisterForRecruiterDto, RegisterForUserDto } from 'src/modules/auth/dto/register.dto';
@Injectable()
export class AccountsRepository {
  constructor(
    @InjectModel(Account.name)
    private readonly accountsModel: Model<AccountsDocument>,
  ) {}

  // [GET]: /admin/accounts
  async findAll(page: number, limit: number, search: string, status?: string) {
    const query: any = {
      ...buildNameSearchQuery(search),
      deleted: false,
    };

    if (status && (status === AccountStatus.ACTIVE || status === AccountStatus.INACTIVE)) {
      query.status = status;
    } else {
      query.status = AccountStatus.ACTIVE;
    }

    const [data, total] = await Promise.all([
      this.accountsModel.find(query).skip((page - 1) * limit).limit(limit).exec(),
      this.accountsModel.countDocuments(query),
    ]);

    return { data, total };
  }

  // [GET]: /admin/accounts/:id/with-roles
  async findOne(id: string) {
    return this.accountsModel.findById(id).lean().exec(); 
  }

  // [GET]: find by email (dùng cho auth, register)
  async findByEmail(email: string) {
    return this.accountsModel.findOne({ email, deleted: false }).lean().exec();
  }

  // [POST]: /admin/accounts/create
  async create(createDto: CreateAccountsDto) {
    const hashed = await bcrypt.hash(createDto.password, 10);
    createDto.password = hashed;
    return this.accountsModel.create(createDto);
  }

  // [PATCH]: /admin/accounts/:id
  async updateById(id: string, updateDto: UpdateAccountsDto) {
    return this.accountsModel
      .findByIdAndUpdate(id, updateDto, { new: true, runValidators: true })
      .exec();
  }

  // [DELETE]: /admin/accounts/:id (soft delete)
  async softDeleteById(id: string) {
    return this.accountsModel
      .findByIdAndUpdate(id, { deleted: true }, { new: true })
      .exec();
  }
  //[POST] : Tạo tài khoản user (phía client)
  async registerUser(dto : RegisterForUserDto){
    return this.accountsModel.create(dto);
  }
  //[POST] : Tạo tài khoản recruiter (phía client)
    //[POST] : Tạo tài khoản user (phía client)
  async registerRecruiter(dto : RegisterForRecruiterDto){
    return this.accountsModel.create(dto);
  }
}
