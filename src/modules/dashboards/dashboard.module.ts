import { Module } from '@nestjs/common';
import { RecruiterDashboardController } from './recruiter-dashboard/recruiter-dashboard.controller';
import { RecruiterDashboardService } from './recruiter-dashboard/recruiter-dashboard.service';
import { AuthModule } from '../auth/auth.module';
import { AccountRolesModule } from '../account_roles/account_roles.module';

@Module({
  imports: [AuthModule, AccountRolesModule],
  controllers: [RecruiterDashboardController],
  providers: [RecruiterDashboardService],
  exports: [RecruiterDashboardService],
})
export class DashboardModule {}
