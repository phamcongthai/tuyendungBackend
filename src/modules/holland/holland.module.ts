import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HollandQuestion, HollandQuestionSchema } from './schemas/holland-question.schema';
import { HollandProfile, HollandProfileSchema } from './schemas/holland-profile.schema';
import { HollandResult, HollandResultSchema } from './schemas/holland-result.schema';
import { HollandQuestionRepository } from './repositories/holland-question.repository';
import { HollandProfileRepository } from './repositories/holland-profile.repository';
import { HollandResultRepository } from './repositories/holland-result.repository';
import { HollandService } from './holland.service';
import { HollandAdminController } from './controllers/holland-admin.controller';
import { HollandClientController } from './controllers/holland-client.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HollandQuestion.name, schema: HollandQuestionSchema },
      { name: HollandProfile.name, schema: HollandProfileSchema },
      { name: HollandResult.name, schema: HollandResultSchema },
    ]),
    UsersModule,
  ],
  controllers: [HollandAdminController, HollandClientController],
  providers: [
    HollandService,
    HollandQuestionRepository,
    HollandProfileRepository,
    HollandResultRepository,
  ],
  exports: [HollandService],
})
export class HollandModule {}
