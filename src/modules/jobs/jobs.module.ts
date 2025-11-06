import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './jobs.schema';
import { Application, ApplicationSchema } from '../applications/schemas/application.schema';
import { JobsService } from './jobs.service';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { JobCategories, JobCategoriesSchema } from '../job-categories/job-categories.schema';
import { AdminJobsController } from './controller/admin.jobs.controller';
import { PublicJobsController } from './controller/public.jobs.controller';
import { RecruiterJobsController } from './controller/recruiter.jobs.controller';
import { JobsRepository } from './repositories/jobs.repository';
import { RecruiterRepository } from '../recruiters/repositories/recruiters.repository';
import { Recruiter, RecruiterSchema } from '../recruiters/schemas/recruiter.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Recruiter.name, schema: RecruiterSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Company.name, schema: CompanySchema },
      { name: JobCategories.name, schema: JobCategoriesSchema },
    ])
  ],
  controllers: [AdminJobsController, PublicJobsController, RecruiterJobsController],
  providers: [JobsService, JobsRepository, RecruiterRepository],
  exports: [JobsService],
})
export class JobsModule {}
