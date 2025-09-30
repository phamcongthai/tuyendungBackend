import { Body, Controller, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SiteSettingsService } from './site-settings.service';

@ApiTags('Site Settings - Admin')
@Controller('admin/site-settings')
export class AdminSiteSettingsController {
  constructor(private readonly service: SiteSettingsService) {}

  @Patch()
  @ApiOperation({ summary: 'Update site settings (logoUrl, faviconUrl, names, titles, notice fields)' })
  async update(@Req() req: any, @Body() body: { logoUrl?: string; faviconUrl?: string; noticeEnabled?: boolean; noticeMessage?: string; noticeColor?: string; clientSiteName?: string; recruiterSiteName?: string; clientTitle?: string; recruiterTitle?: string }) {
    const accountId = req.user?.id as string | undefined; // optional if auth is not enforced
    const safeBody = {
      logoUrl: typeof body.logoUrl === 'string' ? body.logoUrl : undefined,
      faviconUrl: typeof body.faviconUrl === 'string' ? body.faviconUrl : undefined,
      noticeEnabled: typeof body.noticeEnabled === 'boolean' ? body.noticeEnabled : undefined,
      noticeMessage: typeof body.noticeMessage === 'string' ? body.noticeMessage : undefined,
      noticeColor: typeof body.noticeColor === 'string' ? body.noticeColor : undefined,
      clientSiteName: typeof body.clientSiteName === 'string' ? body.clientSiteName : undefined,
      recruiterSiteName: typeof body.recruiterSiteName === 'string' ? body.recruiterSiteName : undefined,
      clientTitle: typeof body.clientTitle === 'string' ? body.clientTitle : undefined,
      recruiterTitle: typeof body.recruiterTitle === 'string' ? body.recruiterTitle : undefined,
    };
    const doc = await this.service.update(safeBody, accountId);
    return { message: 'Updated', data: { logoUrl: doc.logoUrl, faviconUrl: doc.faviconUrl, clientSiteName: doc.clientSiteName, recruiterSiteName: doc.recruiterSiteName, clientTitle: doc.clientTitle, recruiterTitle: doc.recruiterTitle, noticeEnabled: doc.noticeEnabled, noticeMessage: doc.noticeMessage, noticeColor: doc.noticeColor } };
  }
}
