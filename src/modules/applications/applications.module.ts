import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from './schemas/application.schema';
import { Job, JobSchema } from '../jobs/jobs.schema';
import { ApplicationsRepository } from './repositories/applications.repository';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './controllers/applications.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    JobsModule,
    NotificationsModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
  exports: [ApplicationsService, ApplicationsRepository],
})
export class ApplicationsModule {}


