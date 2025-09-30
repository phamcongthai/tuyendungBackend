import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SiteSettingsService } from './site-settings.service';

@ApiTags('Site Settings - Public')
@Controller('site-settings')
export class PublicSiteSettingsController {
  constructor(private readonly service: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get public site settings (logo, favicon, names, notice)' })
  async get() {
    const doc = await this.service.get();
    return { logoUrl: doc.logoUrl, faviconUrl: doc.faviconUrl, clientSiteName: doc.clientSiteName, recruiterSiteName: doc.recruiterSiteName, clientTitle: doc.clientTitle, recruiterTitle: doc.recruiterTitle, noticeEnabled: doc.noticeEnabled, noticeMessage: doc.noticeMessage, noticeColor: doc.noticeColor };
  }
}
