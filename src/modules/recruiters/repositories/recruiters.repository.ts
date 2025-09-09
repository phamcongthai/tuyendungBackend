import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recruiter, RecruiterDocument } from '../schemas/recruiter.schema';
import { CreateRecruiterDto } from '../dto/create-recruiter.dto';
import { UpdateRecruiterDto } from '../dto/update-recruiter.dto';
import cloudinary from '../../../utils/cloudinary.config';
import * as streamifier from 'streamifier';

@Injectable()
export class RecruiterRepository {
  constructor(
    @InjectModel(Recruiter.name) private readonly recruiterModel: Model<RecruiterDocument>,
  ) {}

  // [GET] : /recruiters (Get all recruiters)
  async getAll(): Promise<RecruiterDocument[]> {
    return this.recruiterModel
      .find({ deleted: { $ne: true } })
      .populate('companyId', 'name')
      .exec();
  }

  // [GET] : /recruiters/company/:companyId (Get recruiters by company)
  async getByCompany(companyId: string): Promise<RecruiterDocument[]> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    
    return this.recruiterModel
      .find({ 
        companyId: new Types.ObjectId(companyId), 
        deleted: { $ne: true } 
      })
      .populate('companyId', 'name')
      .exec();
  }

  // [PATCH] : /recruiters/:id/status (Update recruiter status)
  async updateStatus(recruiterId: string, isActive: boolean): Promise<RecruiterDocument | null> {
    if (!Types.ObjectId.isValid(recruiterId)) {
      throw new BadRequestException('Invalid recruiter ID');
    }

    return this.recruiterModel.findByIdAndUpdate(
      recruiterId,
      { $set: { isActive } },
      { new: true }
    );
  }

  // [GET] : /recruiters/profile
  async get(id: string): Promise<RecruiterDocument | null> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid accountId');
    return this.recruiterModel.findOne({ accountId: new Types.ObjectId(id) });
  }

  // [POST] : /recruiters/profile
  async create(id: string, dto: CreateRecruiterDto): Promise<RecruiterDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid accountId');
    const accountId = new Types.ObjectId(id);
    return this.recruiterModel.create({ ...dto, accountId });
  }

  // [PATCH] : /recruiters/profile
  async patch(id: string, dto: UpdateRecruiterDto): Promise<any> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid accountId');
    const accountId = new Types.ObjectId(id);
    return this.recruiterModel.updateOne({ accountId }, { $set: dto });
  }

  // [DELETE] : /recruiters/profile (soft delete)
  async delete(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid accountId');
    const accountId = new Types.ObjectId(id);
    return this.recruiterModel.updateOne({ accountId }, { $set: { deleted: true } });
  }

  // [POST] : /recruiters/profile/avatar
  async uploadAvatar(id: string, file: Express.Multer.File): Promise<any> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid accountId');
    
    try {
      // Upload to cloudinary
      const uploadResult = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: 'avatars/recruiters',
            transformation: [
              { width: 300, height: 300, crop: 'fill' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result?.secure_url || '');
          },
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });

      const accountId = new Types.ObjectId(id);
      
      // Try to update existing recruiter profile
      let updatedRecruiter = await this.recruiterModel.findOneAndUpdate(
        { accountId },
        { $set: { avatar: uploadResult } },
        { new: true }
      );

      // If no profile exists, create a basic one with the avatar
      if (!updatedRecruiter) {
        // For avatar-only uploads, we should not create a profile yet
        // The profile should be created through the proper profile creation endpoint
        throw new BadRequestException('Profile must be created before uploading avatar');
      }

      return {
        avatar: uploadResult,
        recruiter: updatedRecruiter
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }
}
