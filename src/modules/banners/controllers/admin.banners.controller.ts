import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BannersService } from '../banners.service';

@ApiTags('Admin Banners')
@Controller('admin/banners')
export class AdminBannersController {
  constructor(private readonly service: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách banner (chờ duyệt hoặc đã duyệt)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.list({}, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết banner' })
  async detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  // No direct admin create; banners do recruiters submit

  @Patch(':id')
  @ApiOperation({ summary: 'Duyệt/cập nhật banner' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa banner' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}


