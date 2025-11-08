import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HollandService } from '../holland.service';
import { CreateQuestionDto, UpdateQuestionDto } from '../dto/create-question.dto';
import { CreateProfileDto, UpdateProfileDto } from '../dto/create-profile.dto';

@ApiTags('Holland Admin')
@Controller('admin/holland')
export class HollandAdminController {
  constructor(private readonly service: HollandService) {}

  // ============ QUESTIONS ============
  @Get('questions')
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi Holland' })
  getAllQuestions() {
    return this.service.getAllQuestions();
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Lấy chi tiết câu hỏi' })
  @ApiParam({ name: 'id' })
  getQuestionById(@Param('id') id: string) {
    return this.service.getQuestionById(id);
  }

  @Post('questions')
  @ApiOperation({ summary: 'Tạo câu hỏi mới' })
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.service.createQuestion(dto);
  }

  @Put('questions/:id')
  @ApiOperation({ summary: 'Cập nhật câu hỏi' })
  @ApiParam({ name: 'id' })
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.service.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Xóa câu hỏi' })
  @ApiParam({ name: 'id' })
  deleteQuestion(@Param('id') id: string) {
    return this.service.deleteQuestion(id);
  }

  // ============ PROFILES ============
  @Get('profiles')
  @ApiOperation({ summary: 'Lấy danh sách Holland profiles' })
  getAllProfiles() {
    return this.service.getAllProfiles();
  }

  @Get('profiles/:id')
  @ApiOperation({ summary: 'Lấy chi tiết profile' })
  @ApiParam({ name: 'id' })
  getProfileById(@Param('id') id: string) {
    return this.service.getProfileById(id);
  }

  @Post('profiles')
  @ApiOperation({ summary: 'Tạo profile mới' })
  createProfile(@Body() dto: CreateProfileDto) {
    return this.service.createProfile(dto);
  }

  @Put('profiles/:id')
  @ApiOperation({ summary: 'Cập nhật profile' })
  @ApiParam({ name: 'id' })
  updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(id, dto);
  }

  @Delete('profiles/:id')
  @ApiOperation({ summary: 'Xóa profile' })
  @ApiParam({ name: 'id' })
  deleteProfile(@Param('id') id: string) {
    return this.service.deleteProfile(id);
  }

  // ============ RESULTS ============
  @Get('results')
  @ApiOperation({ summary: 'Lấy danh sách kết quả test của users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getAllResults(
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    return this.service.getAllResults(Number(page), Number(limit));
  }
}
