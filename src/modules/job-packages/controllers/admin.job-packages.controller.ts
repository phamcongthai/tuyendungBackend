import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JobPackagesService } from '../job-packages.service';

@ApiTags('Admin Job Packages')
@Controller('admin/job-packages')
export class AdminJobPackagesController {
  constructor(private readonly service: JobPackagesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách gói đăng tin' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll({}, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết gói' })
  async detail(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo gói đăng tin' })
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật gói đăng tin' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa gói đăng tin' })
  async remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}



