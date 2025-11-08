import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BannerPackage, BannerPackageDocument } from '../schemas/banner-package.schema';

@Injectable()
export class BannerPackagesRepository {
  constructor(
    @InjectModel(BannerPackage.name) private readonly model: Model<BannerPackageDocument>,
  ) {}

  async create(data: Partial<BannerPackage>): Promise<BannerPackage> {
    const doc = new this.model(data);
    return await doc.save();
  }

  async update(id: string, data: Partial<BannerPackage>): Promise<BannerPackage> {
    const updated = await this.model.findByIdAndUpdate(new Types.ObjectId(id), data, { new: true });
    if (!updated) throw new BadRequestException('Không tìm thấy gói banner');
    return updated;
  }

  async findById(id: string): Promise<BannerPackage | null> {
    return await this.model.findById(new Types.ObjectId(id));
  }

  async findAll(filter: any = {}, page = 1, limit = 20): Promise<{ data: BannerPackage[]; total: number }> {
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
    if (!res) throw new BadRequestException('Không tìm thấy gói banner');
    return true;
  }
}








