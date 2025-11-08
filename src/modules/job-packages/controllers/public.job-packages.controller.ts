import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JobPackagesService } from '../job-packages.service';

@ApiTags('Public Job Packages')
@Controller('job-packages')
export class PublicJobPackagesController {
  constructor(private readonly service: JobPackagesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách gói public (chỉ active)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll({ isActive: true }, Number(page) || 1, Number(limit) || 50);
  }
}








