import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from '../payments.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';

@ApiTags('Recruiter Banner Orders')
@Controller('recruiters/banner-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Recruiter')
export class RecruiterBannerOrdersController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách đơn gói banner của tôi' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    const accountId = req.user?.id as string;
    return this.paymentsService.listOrdersForAccount(accountId, Number(page) || 1, Number(limit) || 20);
  }
}


