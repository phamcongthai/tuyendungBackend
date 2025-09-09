import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountRole, AccountRoleSchema } from './schemas/account_role.schema';
import { AccountRolesService } from './account_roles.service';
import { AccountRolesController } from './controllers/account_roles.controller';
import { AccountRolesRepository } from './repositories/account_roles.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: AccountRole.name, schema: AccountRoleSchema }])],
  controllers: [AccountRolesController],
  providers: [AccountRolesService, AccountRolesRepository],
  exports: [AccountRolesService, AccountRolesRepository],
})
export class AccountRolesModule {}
