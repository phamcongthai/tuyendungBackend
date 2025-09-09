import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobCategories, JobCategoriesSchema } from './job-categories.schema';
import { Job, JobSchema } from '../jobs/jobs.schema';
import { JobCategoriesService } from './job-categories.service';
import { JobCategoriesController } from './job-categories.controller';
import { PublicJobCategoriesController } from './public-job-categories.controller';
import { JobCategoriesRepository } from './repositories/job-categories.repository';
import { JobCategoriesSeeder } from '../../seeders/job-categories.seeder';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobCategories.name, schema: JobCategoriesSchema },
      { name: Job.name, schema: JobSchema },
    ]),
  ],
  controllers: [JobCategoriesController, PublicJobCategoriesController],
  providers: [JobCategoriesService, JobCategoriesRepository, JobCategoriesSeeder],
})
export class JobCategoriesModule {}
