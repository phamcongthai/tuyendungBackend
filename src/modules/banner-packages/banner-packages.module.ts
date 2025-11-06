import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannerPackage, BannerPackageSchema } from './schemas/banner-package.schema';
import { BannerPackagesRepository } from './repositories/banner-packages.repository';
import { BannerPackagesService } from './banner-packages.service';
import { AdminBannerPackagesController } from './controllers/admin.banner-packages.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: BannerPackage.name, schema: BannerPackageSchema }])],
  controllers: [AdminBannerPackagesController],
  providers: [BannerPackagesRepository, BannerPackagesService],
  exports: [BannerPackagesService],
})
export class BannerPackagesModule {}







