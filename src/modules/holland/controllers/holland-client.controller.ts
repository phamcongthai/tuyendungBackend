import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { HollandService } from '../holland.service';
import { SubmitTestDto } from '../dto/submit-test.dto';

@ApiTags('Holland Test')
@Controller('holland')
export class HollandClientController {
  constructor(private readonly service: HollandService) {}

  @Get('questions')
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi để làm test (public)' })
  getQuestions() {
    return this.service.getAllQuestions();
  }

  @Get('profiles')
  @ApiOperation({ summary: 'Lấy danh sách Holland profiles (public)' })
  getProfiles() {
    return this.service.getAllProfiles();
  }

  @Post('submit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit bài test Holland' })
  submitTest(@Req() req: any, @Body() dto: SubmitTestDto) {
    const accountId = req.user?.id as string;
    return this.service.submitTest(accountId, dto);
  }

  @Get('my-result')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy kết quả test của user hiện tại' })
  getMyResult(@Req() req: any) {
    const accountId = req.user?.id as string;
    return this.service.getResultByAccountId(accountId);
  }
}
