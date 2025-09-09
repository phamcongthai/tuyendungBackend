import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './jobs.schema';
import { JobsService } from './jobs.service';
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
      { name: Recruiter.name, schema: RecruiterSchema }
    ])
  ],
  controllers: [AdminJobsController, PublicJobsController, RecruiterJobsController],
  providers: [JobsService, JobsRepository, RecruiterRepository],
})
export class JobsModule {}
