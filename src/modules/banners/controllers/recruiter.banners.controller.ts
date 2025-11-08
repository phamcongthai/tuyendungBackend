import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BannerPackagesService } from '../../banner-packages/banner-packages.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recruiter, RecruiterDocument } from '../../recruiters/schemas/recruiter.schema';
import { Banner, BannerDocument } from '../schemas/banner.schema';

@ApiTags('Recruiter Banners')
@ApiBearerAuth()
@Controller('recruiters/banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Recruiter')
export class RecruiterBannersController {
  constructor(
    private readonly pkgService: BannerPackagesService,
    @InjectModel(Recruiter.name) private recruiterModel: Model<RecruiterDocument>,
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
  ) {}

  @Get('packages')
  @ApiOperation({ summary: 'Danh sách gói banner active' })
  listPackages() {
    return this.pkgService.list({ isActive: true }, 1, 100);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo banner (sau khi thanh toán thành công)' })
  async createBanner(@Req() req: any, @Body() body: any) {
    const accountId: string = req.user.id;
    const recruiter = await this.recruiterModel.findOne({ accountId: new Types.ObjectId(accountId) });
    if (!recruiter || !recruiter.companyId) {
      return { success: false, message: 'Recruiter chưa có công ty' };
    }

    const pkg = await this.pkgService.detail(body.packageId);
    if (!pkg || !pkg.isActive) {
      return { success: false, message: 'Gói banner không hợp lệ' };
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(startDate.getTime() + (pkg.durationDays || 7) * 24 * 60 * 60 * 1000);

    const doc = await this.bannerModel.create({
      title: body.title,
      imageUrl: body.imageUrl,
      redirectUrl: body.redirectUrl || '',
      altText: body.altText || '',
      packageId: new Types.ObjectId(body.packageId),
      position: pkg.position,
      price: pkg.price,
      companyId: recruiter.companyId,
      recruiterId: recruiter._id,
      startDate,
      endDate,
      approved: false,
      isActive: false,
      rejectedReason: null,
      viewCount: 0,
      clickCount: 0,
    });
    return { success: true, data: doc };
  }
}








