import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SiteSetting, SiteSettingSchema } from './schemas/site-setting.schema';
import { SiteSettingsService } from './site-settings.service';
import { PublicSiteSettingsController } from './site-settings.public.controller';
import { AdminSiteSettingsController } from './site-settings.admin.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SiteSetting.name, schema: SiteSettingSchema }]),
  ],
  controllers: [PublicSiteSettingsController, AdminSiteSettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}


