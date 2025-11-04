import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { MatchScoreController } from './match-score.controller';
import { JobsModule } from '../jobs/jobs.module';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [JobsModule, ApplicationsModule],
  controllers: [AiController, MatchScoreController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}


