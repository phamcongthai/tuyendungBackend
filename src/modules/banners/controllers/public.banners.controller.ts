import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { BannersService } from '../banners.service';

@ApiTags('Public Banners')
@Controller('banners')
export class PublicBannersController {
  constructor(private readonly service: BannersService) {}

  @Get('position/:position')
  @ApiOperation({ summary: 'Danh sách banner active theo vị trí' })
  @ApiParam({ name: 'position' })
  async getByPosition(@Param('position') position: string) {
    return this.service.activeByPosition(position);
  }
}







