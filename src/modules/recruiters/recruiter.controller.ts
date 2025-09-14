import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  Req,
  ParseBoolPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecruiterService } from './recruiter.service';
import { CreateRecruiterDto } from './dto/create-recruiter.dto';
import { UpdateRecruiterDto } from './dto/update-recruiter.dto';
import { multerConfig } from '../../utils/multer.config';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Recruiters')
@Controller('recruiters')
export class RecruiterController {
  constructor(private readonly recruiterService: RecruiterService) {}

  //[GET] : /recruiters/profile
  @ApiOperation({ summary: 'Get recruiter profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  @Roles('Recruiter')
  async getProfile(@Req() req) {
    return this.recruiterService.get(req.user.id);
  }

  //[GET] : /recruiters/profile/ensure
  @ApiOperation({ summary: 'Ensure recruiter profile exists' })
  @ApiResponse({ status: 200, description: 'Profile ensured successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile/ensure')
  @Roles('Recruiter')
  async ensureProfileExists(@Req() req) {
    return this.recruiterService.ensureProfileExists(req.user.id);
  }

  //[GET] : /recruiters (Admin only)
  @ApiOperation({ summary: 'Get all recruiters - Admin only' })
  @ApiResponse({ status: 200, description: 'Recruiters retrieved successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('Admin')
  async getAllRecruiters() {
    return this.recruiterService.getAll();
  }

  //[GET] : /recruiters/company/:companyId
  @ApiOperation({ summary: 'Get recruiters by company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company recruiters retrieved successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('company/:companyId')
  @Roles('Recruiter', 'Admin')
  async getRecruitersByCompany(@Param('companyId') companyId: string) {
    return this.recruiterService.getByCompany(companyId);
  }

  //[POST] : /recruiters/profile
  @ApiOperation({ summary: 'Create recruiter profile' })
  @ApiBody({ type: CreateRecruiterDto })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('profile')
  @Roles('Recruiter')
  async createProfile(@Req() req, @Body() dto: CreateRecruiterDto) {
    return this.recruiterService.create(req.user.id, dto);
  }

  //[PATCH] : /recruiters/profile
  @ApiOperation({ summary: 'Update recruiter profile' })
  @ApiBody({ type: UpdateRecruiterDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('profile')
  @Roles('Recruiter')
  async updateProfile(@Req() req, @Body() dto: UpdateRecruiterDto) {
    return this.recruiterService.patch(req.user.id, dto);
  }

  //[DELETE] : /recruiters/profile
  @ApiOperation({ summary: 'Delete recruiter profile (soft delete)' })
  @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('profile')
  @Roles('Recruiter')
  async deleteProfile(@Req() req) {
    return this.recruiterService.delete(req.user.id);
  }

  //[POST] : /recruiters/profile/avatar
  @ApiOperation({ summary: 'Upload recruiter avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('profile/avatar')
  @Roles('Recruiter')
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  async uploadAvatar(
    @Req() req,
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
    return this.recruiterService.uploadAvatar(req.user.id, file);
  }

  //[PATCH] : /recruiters/:id/status (Admin only)
  @ApiOperation({ summary: 'Update recruiter status - Admin only' })
  @ApiParam({ name: 'id', description: 'Recruiter ID' })
  @ApiQuery({ name: 'isActive', type: 'boolean', description: 'Active status' })
  @ApiResponse({ status: 200, description: 'Recruiter status updated successfully' })
  @ApiResponse({ status: 404, description: 'Recruiter not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  @Roles('Admin')
  async updateRecruiterStatus(
    @Param('id') recruiterId: string,
    @Query('isActive', ParseBoolPipe) isActive: boolean
  ) {
    return this.recruiterService.updateStatus(recruiterId, isActive);
  }
}
