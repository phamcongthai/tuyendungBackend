import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JobPackagesService } from '../job-packages.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recruiter, RecruiterDocument } from '../../recruiters/schemas/recruiter.schema';
import { Company, CompanyDocument } from '../../companies/schemas/company.schema';

@ApiTags('Recruiter Job Packages')
@ApiBearerAuth()
@Controller('recruiters/job-packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Recruiter')
export class RecruiterJobPackagesController {
  constructor(
    private readonly service: JobPackagesService,
    @InjectModel(Recruiter.name) private recruiterModel: Model<RecruiterDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách gói cho recruiter (chỉ active)' })
  async list() {
    return this.service.findAll({ isActive: true }, 1, 100);
  }

  @Post('select/:packageId')
  @ApiOperation({ summary: 'Đăng ký gói cho công ty hiện tại (mặc định gói free nếu price=0)' })
  @ApiParam({ name: 'packageId' })
  async select(@Req() req: any, @Param('packageId') packageId: string, @Body() body: { companyId?: string }) {
    const accountId: string = req.user.id;

    // Find recruiter and company
    const recruiter = await this.recruiterModel.findOne({ accountId: new Types.ObjectId(accountId) });
    if (!recruiter || !recruiter.companyId) {
      return { success: false, message: 'Recruiter chưa có công ty' };
    }
    const companyId = body?.companyId || (recruiter.companyId as Types.ObjectId).toString();

    const pkgRes = await this.service.findById(packageId);
    if (!pkgRes) return { success: false, message: 'Không tìm thấy gói' };

    const durationDays = Number(pkgRes.durationDays || 30);
    const now = new Date();
    const expireAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const remaining = Number(pkgRes?.features?.jobPostLimit || 0);

    const updated = await this.companyModel.findByIdAndUpdate(
      new Types.ObjectId(companyId),
      {
        $set: {
          currentJobPackageId: new Types.ObjectId(packageId),
          packageExpireAt: expireAt,
          remainingJobPosts: remaining,
        },
      },
      { new: true },
    );
    return { success: true, data: updated };
  }
}







