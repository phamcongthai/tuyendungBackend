import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HollandResult, HollandResultDocument } from '../schemas/holland-result.schema';

@Injectable()
export class HollandResultRepository {
  constructor(
    @InjectModel(HollandResult.name) private readonly model: Model<HollandResultDocument>,
  ) {}

  async findAll(page = 1, limit = 20): Promise<{ data: HollandResultDocument[]; total: number }> {
    const data = await this.model
      .find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('accountId', 'fullName email')
      .exec();
    
    const total = await this.model.countDocuments();
    return { data, total };
  }

  async findByAccountId(accountId: string): Promise<HollandResultDocument | null> {
    return this.model
      .findOne({ accountId: new Types.ObjectId(accountId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async create(accountId: string, scores: any, topCode: string, answers: Record<string, number>): Promise<HollandResultDocument> {
    return this.model.create({
      accountId: new Types.ObjectId(accountId),
      scores,
      topCode,
      answers
    });
  }

  async deleteByAccountId(accountId: string): Promise<any> {
    return this.model.deleteMany({ accountId: new Types.ObjectId(accountId) });
  }
}
