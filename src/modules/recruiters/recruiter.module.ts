import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Recruiter, RecruiterSchema } from './schemas/recruiter.schema';
import { RecruiterController } from './recruiter.controller';
import { RecruiterService } from './recruiter.service';
import { RecruiterRepository } from './repositories/recruiters.repository';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Recruiter.name, schema: RecruiterSchema }]),
    AuthModule
  ],
  controllers: [RecruiterController],
  providers: [RecruiterService, RecruiterRepository],
})
export class RecruiterModule {}
