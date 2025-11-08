import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobPackage, JobPackageDocument } from '../schemas/job-package.schema';

@Injectable()
export class JobPackagesRepository {
  constructor(
    @InjectModel(JobPackage.name) private readonly model: Model<JobPackageDocument>,
  ) {}

  async create(data: Partial<JobPackage>): Promise<JobPackage> {
    const exists = await this.model.exists({ packageName: data.packageName });
    if (exists) throw new BadRequestException('Tên gói đã tồn tại');
    const doc = new this.model(data);
    return await doc.save();
  }

  async update(id: string, data: Partial<JobPackage>): Promise<JobPackage> {
    const _id = new Types.ObjectId(id);
    const updated = await this.model.findByIdAndUpdate(_id, data, { new: true });
    if (!updated) throw new BadRequestException('Không tìm thấy gói');
    return updated;
  }

  async findById(id: string): Promise<JobPackage | null> {
    return await this.model.findById(new Types.ObjectId(id));
  }

  async findAll(filter: any = {}, page = 1, limit = 20): Promise<{ data: JobPackage[]; total: number }> {
    const query = { ...filter };
    const data = await this.model
      .find(query)
      .sort({ priorityLevel: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    const total = await this.model.countDocuments(query);
    return { data, total };
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(new Types.ObjectId(id));
    if (!res) throw new BadRequestException('Không tìm thấy gói');
    return true;
  }
}








