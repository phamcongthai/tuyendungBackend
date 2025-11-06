import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Banner, BannerDocument } from '../schemas/banner.schema';
import { BannerPackage, BannerPackageDocument } from '../../banner-packages/schemas/banner-package.schema';

@Injectable()
export class BannersRepository {
  constructor(
    @InjectModel(Banner.name) private readonly model: Model<BannerDocument>,
    @InjectModel(BannerPackage.name) private readonly pkgModel: Model<BannerPackageDocument>,
  ) {}

  async create(data: Partial<Banner>): Promise<Banner> {
    const doc = new this.model(data);
    return await doc.save();
  }

  async update(id: string, data: Partial<Banner>): Promise<Banner> {
    const updated = await this.model.findByIdAndUpdate(new Types.ObjectId(id), data, { new: true });
    if (!updated) throw new BadRequestException('Không tìm thấy banner');
    return updated;
  }

  async findById(id: string): Promise<Banner | null> {
    return await this.model.findById(new Types.ObjectId(id));
  }

  async findAll(filter: any = {}, page = 1, limit = 20): Promise<{ data: Banner[]; total: number }> {
    const data = await this.model
      .find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    const total = await this.model.countDocuments(filter);
    return { data, total };
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(new Types.ObjectId(id));
    if (!res) throw new BadRequestException('Không tìm thấy banner');
    return true;
  }

  async findActiveByPosition(position: string, now: Date = new Date()): Promise<Banner[]> {
    // Lấy tất cả banner active theo position, không giới hạn bởi maxBannerSlots
    // Vì có thể có nhiều banner từ nhiều package khác nhau cùng position
    return await this.model.find({
      position,
      isActive: true,
      approved: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 }).exec();
  }
}


