import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BannerPackagesService } from '../banner-packages.service';

@ApiTags('Admin Banner Packages')
@Controller('admin/banner-packages')
export class AdminBannerPackagesController {
  constructor(private readonly service: BannerPackagesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách gói banner' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.list({}, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết gói banner' })
  detail(@Param('id') id: string) { return this.service.detail(id); }

  @Post()
  @ApiOperation({ summary: 'Tạo gói banner' })
  create(@Body() body: any) { return this.service.create(body); }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật gói banner' })
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa gói banner' })
  remove(@Param('id') id: string) { return this.service.remove(id); }
}



