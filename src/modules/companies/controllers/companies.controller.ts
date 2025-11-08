import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompaniesService } from '../companies.service';
import { CreateCompanyDto } from '../dto/CreateCompany.dto';
import { UpdateCompanyDto } from '../dto/UpdateCompany.dto';
import { multerConfig } from '../../../utils/multer.config';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Recruiter')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  //[GET] : /companies (Get all companies)
  @Get()
  async getAllCompanies() {
    return this.companiesService.getAll();
  }

  //[GET] : /companies/my (Get companies created by current recruiter)
  @Get('my')
  async getMyCompanies(@Req() req: any) {
    return this.companiesService.getMyCompanies(req.user?.id);
  }

  //[POST] : /companies (Create new company)
  @Post()
  async createCompany(@Req() req: any, @Body() dto: CreateCompanyDto) {
    // Attach accountId from token so service can bind recruiter.profile.companyId
    return this.companiesService.create({ ...(dto as any), accountId: req.user?.id } as any);
  }

  //[GET] : /companies/:id (Get company by ID)
  @Get(':id')
  async getCompany(@Param('id') companyId: string) {
    return this.companiesService.get(companyId);
  }

  //[PATCH] : /companies/:id (Update company by ID)
  @Patch(':id')
  async updateCompany(@Param('id') companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.patch(companyId, dto);
  }

  //[DELETE] : /companies/:id (Delete company by ID)
  @Delete(':id')
  async deleteCompany(@Param('id') companyId: string) {
    return this.companiesService.delete(companyId);
  }

  //[POST] : /companies/:id/logo (Upload company logo)
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo', multerConfig))
  @ApiConsumes('multipart/form-data')
  async uploadLogo(
    @Param('id') companyId: string,
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
    return this.companiesService.uploadLogo(companyId, file);
  }

  //[POST] : /companies/:id/background (Upload company background)
  @Post(':id/background')
  @UseInterceptors(FileInterceptor('background', multerConfig))
  @ApiConsumes('multipart/form-data')
  async uploadBackground(
    @Param('id') companyId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /\/(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.companiesService.uploadBackground(companyId, file);
  }

  //[POST] : /companies/avatar
  // @Post('avatar')
  // @UseInterceptors(FileInterceptor('avatar', multerConfig))
  // @ApiConsumes('multipart/form-data')
  // async uploadAvatar(
  //   @Req() req,
  //   @UploadedFile(
  //     new ParseFilePipe({
  //       validators: [
  //         new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
  //         new FileTypeValidator({ fileType: /\/(jpg|jpeg|png|gif|webp)$/ }),
  //       ],
  //     }),
  //   )
  //   file: Express.Multer.File,
  // ) {
  //   return this.companiesService.uploadAvatar(req.user.id, file);
  // }
}
