import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { RolesModule } from '../roles/roles.module';
import { Company, CompanySchema } from './schemas/company.schema';
import { Recruiter, RecruiterSchema } from '../recruiters/schemas/recruiter.schema';
import { Account, AccountSchema } from '../accounts/schema/account.schema';
import { CompaniesController } from './controllers/companies.controller';
import { PublicCompaniesController } from './controllers/public.companies.controller';
import { CompaniesService } from './companies.service';
import { CompaniesRepository } from './repositories/compannies.repository';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Recruiter.name, schema: RecruiterSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [CompaniesController, PublicCompaniesController],
  providers: [CompaniesService, CompaniesRepository],
  exports: [CompaniesService, CompaniesRepository],
})
export class CompaniesModule {}
