import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HollandQuestion, HollandQuestionDocument } from '../schemas/holland-question.schema';
import { CreateQuestionDto, UpdateQuestionDto } from '../dto/create-question.dto';

@Injectable()
export class HollandQuestionRepository {
  constructor(
    @InjectModel(HollandQuestion.name) private readonly model: Model<HollandQuestionDocument>,
  ) {}

  async findAll(): Promise<HollandQuestionDocument[]> {
    return this.model.find({ deleted: { $ne: true } }).sort({ order: 1 }).exec();
  }

  async findById(id: string): Promise<HollandQuestionDocument | null> {
    return this.model.findById(id).exec();
  }

  async create(dto: CreateQuestionDto): Promise<HollandQuestionDocument> {
    return this.model.create(dto);
  }

  async update(id: string, dto: UpdateQuestionDto): Promise<HollandQuestionDocument | null> {
    return this.model.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
  }

  async delete(id: string): Promise<HollandQuestionDocument | null> {
    return this.model.findByIdAndUpdate(id, { $set: { deleted: true } }, { new: true }).exec();
  }

  async countByCategory(): Promise<Record<string, number>> {
    const result = await this.model.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const counts: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    result.forEach(item => {
      counts[item._id] = item.count;
    });
    return counts;
  }
}
