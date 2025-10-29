import { Injectable, Logger } from '@nestjs/common';
import { AccountsRepository } from '../modules/accounts/repositories/accounts.repository';
import { RolesRepository } from '../modules/roles/repositories/roles.repository';
import { AccountRolesRepository } from '../modules/account_roles/repositories/account_roles.repository';
import { Types } from 'mongoose';

@Injectable()
export class AdminAccountSeeder {
  private readonly logger = new Logger(AdminAccountSeeder.name);

  private readonly ADMIN_EMAIL = 'admin@gmail.com';
  private readonly ADMIN_PASSWORD = '12345678';

  constructor(
    private readonly accountsRepo: AccountsRepository,
    private readonly rolesRepo: RolesRepository,
    private readonly accountRolesRepo: AccountRolesRepository,
  ) {}

  async seed() {
    this.logger.log('Seeding default admin account...');

    // 1) Ensure Admin role exists
    let adminRole = await this.rolesRepo.findByName('Admin') as any;
    if (!adminRole) {
      adminRole = await this.rolesRepo.create({
        name: 'Admin',
        permissions: [
          'admin.access',
          'users.read', 'users.write', 'users.delete',
          'roles.read', 'roles.write', 'roles.delete',
          'jobs.read', 'jobs.write', 'jobs.delete',
          'companies.read', 'companies.write', 'companies.delete',
          'applications.read', 'applications.write', 'applications.delete',
          'system.manage'
        ],
      } as any);
      this.logger.log('Created Admin role');
    }

    // 2) Ensure Admin account exists (email unique enforced on schema)
    let adminAccount = await this.accountsRepo.findByEmail(this.ADMIN_EMAIL) as any;
    if (!adminAccount) {
      adminAccount = await this.accountsRepo.create({
        email: this.ADMIN_EMAIL,
        password: this.ADMIN_PASSWORD,
      } as any);
      this.logger.log(`Created admin account: ${this.ADMIN_EMAIL}`);
    } else {
      this.logger.log(`Admin account already exists: ${this.ADMIN_EMAIL}`);
    }

    // 3) Ensure mapping account-role exists
    const accountId = new Types.ObjectId(adminAccount._id);
    const roleId = new Types.ObjectId(adminRole._id);
    const existingMapping = await this.accountRolesRepo.findOne(accountId, roleId).catch(() => null);
    if (!existingMapping) {
      await this.accountRolesRepo.create({ accountId, roleId } as any);
      this.logger.log('Linked admin account with Admin role');
    } else {
      this.logger.log('Admin account already linked to Admin role');
    }

    this.logger.log('Default admin seeding completed');
  }
}


