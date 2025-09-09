import { Injectable } from '@nestjs/common';
import { CreateTmpDto } from './dto/create-tmp.dto';
import { UpdateTmpDto } from './dto/update-tmp.dto';

@Injectable()
export class TmpService {
  create(createTmpDto: CreateTmpDto) {
    return 'This action adds a new tmp';
  }

  findAll() {
    return `This action returns all tmp`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tmp`;
  }

  update(id: number, updateTmpDto: UpdateTmpDto) {
    return `This action updates a #${id} tmp`;
  }

  remove(id: number) {
    return `This action removes a #${id} tmp`;
  }
}
