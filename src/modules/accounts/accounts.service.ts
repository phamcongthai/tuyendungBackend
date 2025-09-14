import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountsRepository } from './repositories/accounts.repository';
import { CreateAccountsDto } from './dtos/CreateAccountsDto.dto';
import { UpdateAccountsDto } from './dtos/UpdateAccounts.Dto.dto';
import { AccountRolesRepository } from '../account_roles/repositories/account_roles.repository';
import { RolesRepository } from '../roles/repositories/roles.repository';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { RegisterForUserDto, RegisterForRecruiterDto } from '../auth/dto/register.dto';
import { AccountStatus } from './enums/accounts.enum';
import { LoginDto } from '../auth/dto/login.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types as MTypes } from 'mongoose';
import { Recruiter, RecruiterDocument, CompanyRole } from '../recruiters/schemas/recruiter.schema';
@Injectable()
export class AccountsService {
  constructor(
    private readonly accountsRepo: AccountsRepository,
    private readonly accountRolesRepo: AccountRolesRepository,
    private readonly rolesRepo: RolesRepository,
    private readonly jwtService: JwtService,
    @InjectModel(Recruiter.name) private recruiterModel: Model<RecruiterDocument>,
  ) {}

  // Lấy tất cả account với phân trang, search, filter trạng thái
  async findAll(page: number, limit: number, search: string, status?: string) {
    return await this.accountsRepo.findAll(page, limit, search, status);
  }

  // Lấy account theo id cùng roleIds
  async findOne(id: string) {
    const account = await this.accountsRepo.findOne(id);
    if (!account) return null;

    const accountRoles = await this.accountRolesRepo.findByAccountId(new Types.ObjectId(id));
    const roleIds = accountRoles.map((ar) => ar.roleId.toString());

    return {
      ...account,
      roleIds,
    };
  }

  // Tạo account mới + gán role
  async create(createAccountsDto: CreateAccountsDto) {
    if (!createAccountsDto.roleId) {
      throw new BadRequestException('Bạn phải chọn role cho account');
    }

    const account = await this.accountsRepo.create(createAccountsDto);

    await this.accountRolesRepo.create({
      accountId: new Types.ObjectId(account._id as string),
      roleId: new Types.ObjectId(createAccountsDto.roleId),
    });

    return account;
  }

  // Cập nhật account thông tin cơ bản + role
  async update(id: string, updateAccountsDto: UpdateAccountsDto) {
    const payload: UpdateAccountsDto = { ...updateAccountsDto };

    if ((updateAccountsDto as any).password) {
      payload.password = await bcrypt.hash((updateAccountsDto as any).password, 10);
    }

    const updatedAccount = await this.accountsRepo.updateById(id, payload);

    if (updateAccountsDto.roleIds && Array.isArray(updateAccountsDto.roleIds)) {
      const existingRoles = await this.accountRolesRepo.findByAccountId(new Types.ObjectId(id));
      const existingRoleIds = existingRoles.map((r) => r.roleId.toString());

      const newRoleIds = updateAccountsDto.roleIds;

      const toAdd = newRoleIds.filter((rid) => !existingRoleIds.includes(rid));
      const toRemove = existingRoleIds.filter((rid) => !newRoleIds.includes(rid));

      for (const rid of toRemove) {
        await this.accountRolesRepo.deleteOne(new Types.ObjectId(id), new Types.ObjectId(rid));
      }

      for (const rid of toAdd) {
        await this.accountRolesRepo.create({
          accountId: new Types.ObjectId(id),
          roleId: new Types.ObjectId(rid),
        });
      }
    }

    return updatedAccount;
  }

  // Xóa mềm account và xóa các quan hệ role liên quan
  async remove(id: string) {
    const deleted = await this.accountsRepo.softDeleteById(id);
    await this.accountRolesRepo.deleteByAccountId(new Types.ObjectId(id));
    return deleted;
  }

  // Đăng ký user
  async registerForUser(registerUserDto: RegisterForUserDto) {
  const existing = await this.accountsRepo.findByEmail(registerUserDto.email);
  if (existing) throw new BadRequestException('Email đã tồn tại');

  const hashed = await bcrypt.hash(registerUserDto.password, 10);

  const userRole = await this.rolesRepo.findByName('User') as { _id: string } | null;
  if (!userRole) throw new BadRequestException('Role mặc định chưa tồn tại');

  // Gán password đã hash
  const account = await this.accountsRepo.registerUser({
    ...registerUserDto,
    password: hashed,
  });

  await this.accountRolesRepo.create({
    accountId: new Types.ObjectId(account._id as string),
    roleId: new Types.ObjectId(userRole._id as string),
  });

  return account;
}
// Đăng ký recruiter
  async registerForRecruiter(registerRecruiterDto: RegisterForRecruiterDto) {
    console.log("Đã đến account");
    
  const existing = await this.accountsRepo.findByEmail(registerRecruiterDto.email);
  if (existing) throw new BadRequestException('Email đã tồn tại');

  const hashed = await bcrypt.hash(registerRecruiterDto.password, 10);

  const userRole = await this.rolesRepo.findByName('Recruiter') as { _id: string } | null;
  if (!userRole) throw new BadRequestException('Role mặc định chưa tồn tại');

  // Gán password đã hash
  const account = await this.accountsRepo.registerRecruiter({
    ...registerRecruiterDto,
    password: hashed,
  });

  await this.accountRolesRepo.create({
    accountId: new Types.ObjectId(account._id as string),
    roleId: new Types.ObjectId(userRole._id as string),
  });

  // Tạo hồ sơ Recruiter rỗng ngay sau khi tạo account
  try {
    console.log('Starting recruiter profile creation for account:', account._id);
    
    // Kiểm tra xem recruiter đã tồn tại chưa
    const existingRecruiter = await this.recruiterModel.findOne({
      accountId: new MTypes.ObjectId(account._id as string)
    });

    if (!existingRecruiter) {
      const recruiterData = {
        accountId: new MTypes.ObjectId(account._id as string),
        email: account.email, // Set email để tránh duplicate key error
        // Chỉ set trường required, các trường khác sẽ dùng default values
      };
      
      console.log('Creating recruiter with data:', recruiterData);
      const createdRecruiter = await this.recruiterModel.create(recruiterData);
      console.log('Recruiter profile created successfully for account:', account._id, 'Recruiter ID:', createdRecruiter._id);
    } else {
      console.log('Recruiter profile already exists for account:', account._id);
    }
  } catch (error) {
    console.error('Error creating recruiter profile:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    // Không throw error để không ảnh hưởng đến việc tạo account
    // Recruiter profile có thể được tạo sau
  }

  return account;
}
async login(dto: LoginDto) {
    // 1️⃣ Kiểm tra tài khoản
    const existing = await this.accountsRepo.findByEmail(dto.email);
    if (!existing) {
      throw new BadRequestException('Email không tồn tại!');
    }

    // 2️⃣ So sánh mật khẩu
    const isMatch = await bcrypt.compare(dto.password, existing.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu không đúng');
    }

    // 3️⃣ Lấy roles từ repo (đã populate)
    const accountId = new Types.ObjectId(existing._id.toString());
    const roles = await this.accountRolesRepo.findRolesByAccountId(accountId); 
    // roles sẽ là mảng string ['admin', 'recruiter']

    // 4️⃣ Tạo payload JWT
    const payload = {
      sub: existing._id.toString(),
      email: existing.email,
      roles,
    };

    // 5️⃣ Tạo token
    const token = this.jwtService.sign(payload);
    console.log("Đây là token tạo ra : " + token);
    

    // 6️⃣ Trả về token và thông tin user
    return {
      token,
      user: {
        id: existing._id.toString(),
        fullName: existing.fullName,
        email: existing.email,
        isVerified: existing.isVerified,
        phone: existing.phone,
        roles,
      },
    };
  }

  async findByEmail(email: string) {
    return this.accountsRepo.findByEmail(email);
  }
}
