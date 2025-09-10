import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CvSample, CvSampleDocument } from '../schemas/cv-sample.schema';

@Injectable()
export class CvSampleRepository {
  constructor(
    @InjectModel(CvSample.name) private cvSampleModel: Model<CvSampleDocument>,
  ) {}

  async create(createData: Partial<CvSample>): Promise<CvSample> {
    const cvSample = new this.cvSampleModel(createData);
    return cvSample.save();
  }

  async findAll(page?: number, limit?: number, isActive?: boolean): Promise<{ data: CvSample[]; total: number; page: number; limit: number }> {
    const query: any = { isDeleted: false };
    
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const skip = page && limit ? (page - 1) * limit : 0;
    const take = limit || 0;

    const [data, total] = await Promise.all([
      this.cvSampleModel.find(query).skip(skip).limit(take).sort({ createdAt: -1 }),
      this.cvSampleModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page: page || 1,
      limit: limit || total,
    };
  }

  async findById(id: string): Promise<CvSample | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.cvSampleModel.findOne({ _id: id, isDeleted: false });
  }

  async update(id: string, updateData: Partial<CvSample>): Promise<CvSample | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.cvSampleModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateData,
      { new: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await this.cvSampleModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    return !!result;
  }

  async hardDelete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await this.cvSampleModel.findByIdAndDelete(id);
    return !!result;
  }

  async findActive(): Promise<CvSample[]> {
    return this.cvSampleModel.find({ isActive: true, isDeleted: false }).sort({ createdAt: -1 });
  }
}
