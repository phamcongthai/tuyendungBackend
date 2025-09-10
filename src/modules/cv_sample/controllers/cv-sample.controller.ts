import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CvSampleService } from '../cv-sample.service';
import { CreateCvSampleDto } from '../dto/create-cv-sample.dto';
import { UpdateCvSampleDto } from '../dto/update-cv-sample.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('CV Samples')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('cv-samples')
export class CvSampleController {
  constructor(private readonly cvSampleService: CvSampleService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo CV mẫu mới' })
  @ApiResponse({ status: 201, description: 'Tạo CV mẫu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  create(@Body() createCvSampleDto: CreateCvSampleDto) {
    return this.cvSampleService.create(createCvSampleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách CV mẫu' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Số trang' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Số lượng mỗi trang' })
  @ApiQuery({ name: 'isActive', required: false, example: true, description: 'Lọc theo trạng thái hoạt động' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const isActiveBool = isActive ? isActive === 'true' : undefined;
    
    return this.cvSampleService.findAll(pageNum, limitNum, isActiveBool);
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách CV mẫu đang hoạt động' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách CV mẫu hoạt động thành công' })
  findActive() {
    return this.cvSampleService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết CV mẫu theo ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID của CV mẫu' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy CV mẫu' })
  findOne(@Param('id') id: string) {
    return this.cvSampleService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật CV mẫu' })
  @ApiParam({ name: 'id', required: true, description: 'ID của CV mẫu' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy CV mẫu' })
  update(@Param('id') id: string, @Body() updateCvSampleDto: UpdateCvSampleDto) {
    return this.cvSampleService.update(id, updateCvSampleDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Bật/tắt trạng thái hoạt động của CV mẫu' })
  @ApiParam({ name: 'id', required: true, description: 'ID của CV mẫu' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy CV mẫu' })
  toggleActive(@Param('id') id: string) {
    return this.cvSampleService.toggleActive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm CV mẫu' })
  @ApiParam({ name: 'id', required: true, description: 'ID của CV mẫu' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy CV mẫu' })
  remove(@Param('id') id: string) {
    return this.cvSampleService.delete(id);
  }

  @Delete(':id/hard')
  @ApiOperation({ summary: 'Xóa vĩnh viễn CV mẫu' })
  @ApiParam({ name: 'id', required: true, description: 'ID của CV mẫu' })
  @ApiResponse({ status: 200, description: 'Xóa vĩnh viễn thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy CV mẫu' })
  hardDelete(@Param('id') id: string) {
    return this.cvSampleService.hardDelete(id);
  }
}
