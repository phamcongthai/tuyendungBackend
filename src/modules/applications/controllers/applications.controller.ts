import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from '../applications.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { multerDocsConfig } from '../../../utils/multer.docs.config';
import cloudinary from '../../../utils/cloudinary.config';
import * as streamifier from 'streamifier';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  // Ứng viên nộp đơn
  @Post()
  @ApiOperation({ summary: 'Nộp đơn ứng tuyển' })
  @ApiBody({ schema: { properties: { jobId: { type: 'string', example: '65f1c0d2a1b2c3d4e5f6a7b8' }, coverLetter: { type: 'string', example: 'Quan tâm vị trí này' } } } })
  @ApiResponse({ status: 201, description: 'Tạo đơn ứng tuyển thành công' })
  create(@Req() req: any, @Body() body: { jobId: string; coverLetter?: string }) {
    const accountId = req.user?.id as string;
    return this.service.createFromAccount(accountId, body.jobId, body.coverLetter);
  }

  // Upload resume (pdf/doc/docx) -> Cloudinary (resource_type: raw)
  @Post('upload-resume')
  @UseInterceptors(FileInterceptor('file', multerDocsConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload CV/Resume (pdf/doc/docx)' })
  @ApiResponse({ status: 201, description: 'Upload thành công, trả về url' })
  async uploadResume(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }),
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    const originalName = file.originalname || 'resume';
    const nameParts = originalName.split('.');
    const ext = nameParts.length > 1 ? nameParts.pop() : undefined;
    const baseName = nameParts.join('.') || 'resume';

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'resumes',
          resource_type: 'raw',
          type: 'upload',
          access_mode: 'public',
          use_filename: true,
          unique_filename: true,
          filename_override: baseName,
          ...(ext ? { format: ext } : {}),
        },
        (error, res) => {
          if (error) return reject(error);
          resolve(res);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });

    const secureUrl: string = result?.secure_url || '';
    const downloadUrl = secureUrl ? `${secureUrl}?fl_attachment=${encodeURIComponent(originalName)}` : '';
    return { url: secureUrl, downloadUrl };
  }

  // Danh sách đơn theo user
  @Get()
  @ApiOperation({ summary: 'Danh sách đơn theo userId hoặc accountId' })
  @ApiQuery({ name: 'userId', required: true, description: 'userId hoặc accountId' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 12 })
  findAllByUser(
    @Query('userId') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '12',
  ) {
    return this.service.findAllByUser(userId, Number(page), Number(limit));
  }

  // Danh sách đơn theo job (cho recruiter/admin)
  @Get('by-job/:jobId')
  @ApiOperation({ summary: 'Danh sách đơn theo jobId (recruiter/admin)' })
  @ApiParam({ name: 'jobId', required: true })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 12 })
  findAllByJob(
    @Param('jobId') jobId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '12',
  ) {
    return this.service.findAllByJob(jobId, Number(page), Number(limit));
  }

  // Lấy chi tiết đơn
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn ứng tuyển theo id' })
  @ApiParam({ name: 'id', required: true })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // Cập nhật trạng thái (accepted/rejected/pending/withdrawn)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn' })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ schema: { properties: { status: { type: 'string', enum: ['pending','accepted','rejected','withdrawn'] }, note: { type: 'string' } } } })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'; note?: string },
  ) {
    return this.service.updateStatus(id, body.status, body.note);
  }

  // Ứng viên tự hủy đơn của mình
  @Patch(':id/withdraw')
  @ApiOperation({ summary: 'Ứng viên tự hủy đơn' })
  @ApiParam({ name: 'id', required: true })
  withdraw(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const accountId = req.user?.id as string;
    return this.service.withdrawByUser(accountId, id);
  }
}


