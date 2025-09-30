import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SiteSetting, SiteSettingDocument } from './schemas/site-setting.schema';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectModel(SiteSetting.name) private readonly model: Model<SiteSettingDocument>,
  ) {}

  async get(): Promise<SiteSetting> {
    const existing = await this.model.findOne({ key: 'site' });
    if (existing) return existing;
    return this.model.create({ key: 'site', logoUrl: '', faviconUrl: '', clientSiteName: 'TopJobs', recruiterSiteName: 'ThaiCV Recruiter', clientTitle: '', recruiterTitle: '', noticeEnabled: false, noticeMessage: '', noticeColor: '#1677ff' });
  }

  async update(payload: { logoUrl?: string; faviconUrl?: string; noticeEnabled?: boolean; noticeMessage?: string; noticeColor?: string; clientSiteName?: string; recruiterSiteName?: string; clientTitle?: string; recruiterTitle?: string }, updatedBy?: string) {
    const update: any = {};
    if (typeof payload.logoUrl === 'string') update.logoUrl = payload.logoUrl;
    if (typeof payload.faviconUrl === 'string') update.faviconUrl = payload.faviconUrl;
    if (typeof payload.noticeEnabled === 'boolean') update.noticeEnabled = payload.noticeEnabled;
    if (typeof payload.noticeMessage === 'string') update.noticeMessage = payload.noticeMessage;
    if (typeof payload.noticeColor === 'string') update.noticeColor = payload.noticeColor;
    if (typeof payload.clientSiteName === 'string') update.clientSiteName = payload.clientSiteName;
    if (typeof payload.recruiterSiteName === 'string') update.recruiterSiteName = payload.recruiterSiteName;
    if (typeof payload.clientTitle === 'string') update.clientTitle = payload.clientTitle;
    if (typeof payload.recruiterTitle === 'string') update.recruiterTitle = payload.recruiterTitle;
    if (updatedBy && Types.ObjectId.isValid(updatedBy)) update.updatedBy = new Types.ObjectId(updatedBy);
    const doc = await this.model.findOneAndUpdate(
      { key: 'site' },
      { $set: update },
      { new: true, upsert: true },
    );
    return doc;
  }
}
