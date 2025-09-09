import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TmpService } from './tmp.service';
import { CreateTmpDto } from './dto/create-tmp.dto';
import { UpdateTmpDto } from './dto/update-tmp.dto';

@Controller('tmp')
export class TmpController {
  constructor(private readonly tmpService: TmpService) {}

  @Post()
  create(@Body() createTmpDto: CreateTmpDto) {
    return this.tmpService.create(createTmpDto);
  }

  @Get()
  findAll() {
    return this.tmpService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tmpService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTmpDto: UpdateTmpDto) {
    return this.tmpService.update(+id, updateTmpDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tmpService.remove(+id);
  }
}
