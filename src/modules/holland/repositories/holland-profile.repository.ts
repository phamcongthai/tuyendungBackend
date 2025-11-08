import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HollandProfile, HollandProfileDocument } from '../schemas/holland-profile.schema';
import { CreateProfileDto, UpdateProfileDto } from '../dto/create-profile.dto';

@Injectable()
export class HollandProfileRepository {
  constructor(
    @InjectModel(HollandProfile.name) private readonly model: Model<HollandProfileDocument>,
  ) {}

  async findAll(): Promise<HollandProfileDocument[]> {
    return this.model.find({ deleted: { $ne: true } }).sort({ code: 1 }).exec();
  }

  async findById(id: string): Promise<HollandProfileDocument | null> {
    return this.model.findById(id).exec();
  }

  async findByCode(code: string): Promise<HollandProfileDocument | null> {
    return this.model.findOne({ code, deleted: { $ne: true } }).exec();
  }

  async create(dto: CreateProfileDto): Promise<HollandProfileDocument> {
    return this.model.create(dto);
  }

  async update(id: string, dto: UpdateProfileDto): Promise<HollandProfileDocument | null> {
    return this.model.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
  }

  async delete(id: string): Promise<HollandProfileDocument | null> {
    return this.model.findByIdAndUpdate(id, { $set: { deleted: true } }, { new: true }).exec();
  }
}
