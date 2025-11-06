import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Banner, BannerSchema } from './schemas/banner.schema';
import { BannersRepository } from './repositories/banners.repository';
import { BannersService } from './banners.service';
import { AdminBannersController } from './controllers/admin.banners.controller';
import { PublicBannersController } from './controllers/public.banners.controller';
import { RecruiterBannersController } from './controllers/recruiter.banners.controller';
import { BannerPackage, BannerPackageSchema } from '../banner-packages/schemas/banner-package.schema';
import { BannerPackagesModule } from '../banner-packages/banner-packages.module';
import { Recruiter, RecruiterSchema } from '../recruiters/schemas/recruiter.schema';

@Module({
  imports: [
    BannerPackagesModule,
    MongooseModule.forFeature([
      { name: Banner.name, schema: BannerSchema },
      { name: BannerPackage.name, schema: BannerPackageSchema },
      { name: Recruiter.name, schema: RecruiterSchema },
    ]),
  ],
  controllers: [AdminBannersController, PublicBannersController, RecruiterBannersController],
  providers: [BannersRepository, BannersService],
  exports: [BannersService],
})
export class BannersModule {}


