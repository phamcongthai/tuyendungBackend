import { Module } from '@nestjs/common';
import { TmpService } from './tmp.service';
import { TmpController } from './tmp.controller';

@Module({
  controllers: [TmpController],
  providers: [TmpService],
})
export class TmpModule {}
