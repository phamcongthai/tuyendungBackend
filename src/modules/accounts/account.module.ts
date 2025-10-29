import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Account, AccountSchema } from './schema/account.schema'
import { Recruiter, RecruiterSchema } from '../recruiters/schemas/recruiter.schema';
import { AccountsService } from './accounts.service';
import { AccountsController } from './controllers/accounts.controller';
import { AccountsRepository } from './repositories/accounts.repository';
import { AccountRolesModule } from '../account_roles/account_roles.module';
import { RolesModule } from '../roles/roles.module';
import { AdminAccountSeeder } from '../../seeders/admin-account.seeder';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: Recruiter.name, schema: RecruiterSchema },
    ]),
    AccountRolesModule, 
    RolesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'donthackmepls!',
      signOptions: { expiresIn: '1h', algorithm: 'HS256' },
    }),
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository, AdminAccountSeeder],
  exports: [AccountsService, AccountsRepository],
})
export class AccountsModule {}
