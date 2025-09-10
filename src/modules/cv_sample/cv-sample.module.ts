import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CvSampleController } from './controllers/cv-sample.controller';
import { PublicCvSampleController } from './controllers/public-cv-sample.controller';
import { CvBuilderController } from './controllers/cv-builder.controller';
import { CvSampleService } from './cv-sample.service';
import { CvRenderService } from './services/cv-render.service';
import { CvSampleRepository } from './repositories/cv-sample.repository';
import { CvSample, CvSampleSchema } from './schemas/cv-sample.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CvSample.name, schema: CvSampleSchema },
    ]),
    UsersModule,
  ],
  controllers: [CvSampleController, PublicCvSampleController, CvBuilderController],
  providers: [CvSampleService, CvRenderService, CvSampleRepository],
  exports: [CvSampleService, CvRenderService, CvSampleRepository],
})
export class CvSampleModule {}
