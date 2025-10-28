import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { Req } from '@nestjs/common';

@ApiTags('Upload')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('diag')
  @ApiOperation({ summary: 'Diagnostics for Supabase upload configuration' })
  @ApiResponse({ status: 200, description: 'Current server-side Supabase env visibility' })
  diag() {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const bucket = process.env.SUPABASE_BUCKET || process.env.VITE_SUPABASE_BUCKET;
    return {
      supabaseUrlSet: Boolean(url),
      keyDetected: serviceKey ? 'service_role' : (anonKey ? 'anon' : 'missing'),
      bucket,
    };
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload image to Cloudinary',
    description: 'Upload an image file to Cloudinary and return the secure URL',
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://res.cloudinary.com/...' },
        secure_url: { type: 'string', example: 'https://res.cloudinary.com/...' },
        public_id: { type: 'string', example: 'cv-samples/demo_abc123' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /\/(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.uploadService.uploadImage(file);
  }

  // New endpoint for site assets (logo, favicon) - allow svg and ico
  @Post('site-asset')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload site asset (logo/favicon) to Cloudinary' })
  @ApiResponse({ status: 201, description: 'Uploaded successfully' })
  async uploadSiteAsset(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          // Accept common favicon/logo mime types
          new FileTypeValidator({ fileType: /(image\/(png|jpg|jpeg|gif|webp|svg\+xml|x-icon|vnd\.microsoft\.icon))$/ }),
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.uploadService.uploadSiteAsset(file);
  }

  @Post('cv-pdf')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload CV PDF to Supabase (server-side, bypass RLS)' })
  @ApiResponse({ status: 201, description: 'Uploaded successfully' })
  async uploadCvPdf(
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(application\/pdf)$/ })
        ]
      })
    ) file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const accountId = req?.user?.id || 'anonymous';
    return this.uploadService.uploadCvPdfToSupabase(file, accountId);
  }
}
