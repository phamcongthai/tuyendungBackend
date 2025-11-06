import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobPackage, JobPackageSchema } from './schemas/job-package.schema';
import { JobPackagesRepository } from './repositories/job-packages.repository';
import { JobPackagesService } from './job-packages.service';
import { AdminJobPackagesController } from './controllers/admin.job-packages.controller';
import { PublicJobPackagesController } from './controllers/public.job-packages.controller';
import { RecruiterJobPackagesController } from './controllers/recruiter.job-packages.controller';
import { Recruiter, RecruiterSchema } from '../recruiters/schemas/recruiter.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: JobPackage.name, schema: JobPackageSchema },
    { name: Recruiter.name, schema: RecruiterSchema },
    { name: Company.name, schema: CompanySchema },
  ])],
  controllers: [AdminJobPackagesController, PublicJobPackagesController, RecruiterJobPackagesController],
  providers: [JobPackagesRepository, JobPackagesService],
  exports: [JobPackagesService],
})
export class JobPackagesModule {}


