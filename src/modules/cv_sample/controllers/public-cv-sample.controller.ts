import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CvSampleService } from '../cv-sample.service';

@ApiTags('Public CV Samples')
@Controller('public/cv-samples')
export class PublicCvSampleController {
  constructor(private readonly cvSampleService: CvSampleService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách CV mẫu đang hoạt động (không cần xác thực)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách CV mẫu hoạt động thành công' })
  findActive() {
    return this.cvSampleService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết CV mẫu theo ID (không cần xác thực)' })
  @ApiParam({ name: 'id', required: true, description: 'ID của CV mẫu' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy CV mẫu' })
  findOne(@Param('id') id: string) {
    return this.cvSampleService.findById(id);
  }
}
