import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from '../payments.service';
import { Types } from 'mongoose';

@ApiTags('Admin Banner Orders')
@Controller('admin/banner-orders')
export class AdminBannerOrdersController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách banner orders' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'packageId', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'PENDING|PAID|FAILED|CANCELLED' })
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('packageId') packageId?: string,
    @Query('status') status?: string,
  ) {
    const filter: any = {};
    if (status) filter.status = status;
    if (packageId) filter.packageId = new Types.ObjectId(packageId);
    return this.paymentsService.listOrders(filter, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết banner order' })
  async detail(@Param('id') id: string) {
    return this.paymentsService.getOrderById(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Duyệt đơn và tạo banner' })
  async approve(@Param('id') id: string) {
    return this.paymentsService.approveOrderAndCreateBanner(id);
  }
}


