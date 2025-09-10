import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CvSampleService } from '../cv-sample.service';
import { CvRenderService } from '../services/cv-render.service';
import { UsersService } from '../../users/user.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('CV Builder')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cv-builder')
export class CvBuilderController {
  constructor(
    private readonly cvSampleService: CvSampleService,
    private readonly cvRenderService: CvRenderService,
    private readonly usersService: UsersService,
  ) {}

  @Get('templates')
  @ApiOperation({ summary: 'Lấy danh sách mẫu CV đang hoạt động' })
  @ApiResponse({ status: 200, description: 'Danh sách mẫu CV' })
  async getTemplates() {
    return this.cvSampleService.findActive();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Lấy chi tiết mẫu CV' })
  @ApiParam({ name: 'id', description: 'ID mẫu CV' })
  @ApiResponse({ status: 200, description: 'Chi tiết mẫu CV' })
  async getTemplate(@Param('id') id: string) {
    return this.cvSampleService.findById(id);
  }

  @Post('save')
  @ApiOperation({ summary: 'Lưu CV của người dùng' })
  @ApiResponse({ status: 201, description: 'CV đã được lưu thành công' })
  async saveCv(
    @Req() req: any,
    @Body() body: { cvId: string; cvFields: any }
  ) {
    const accountId = req.user.id;
    return this.usersService.saveCv(accountId, body.cvId, body.cvFields);
  }

  @Get('user-cv')
  @ApiOperation({ summary: 'Lấy CV của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'CV của người dùng' })
  async getUserCv(@Req() req: any) {
    const accountId = req.user.id;
    return this.usersService.getUserCv(accountId);
  }

  @Put('update')
  @ApiOperation({ summary: 'Cập nhật CV của người dùng' })
  @ApiResponse({ status: 200, description: 'CV đã được cập nhật thành công' })
  async updateCv(
    @Req() req: any,
    @Body() body: { cvId: string; cvFields: any }
  ) {
    const accountId = req.user.id;
    return this.usersService.saveCv(accountId, body.cvId, body.cvFields);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Xóa CV của người dùng' })
  @ApiResponse({ status: 200, description: 'CV đã được xóa thành công' })
  async deleteCv(@Req() req: any) {
    const accountId = req.user.id;
    return this.usersService.deleteCv(accountId);
  }

  @Get('render/:userId')
  @ApiOperation({ summary: 'Render CV hoàn chỉnh của người dùng' })
  @ApiParam({ name: 'userId', description: 'ID người dùng' })
  @ApiResponse({ status: 200, description: 'CV đã được render' })
  async renderUserCv(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.cvId) {
      throw new Error('User CV not found');
    }
    
    return this.cvRenderService.renderUserCv(user);
  }
}
