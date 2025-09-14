import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { CreateCompanyDto } from '../dto/CreateCompany.dto';
import { UpdateCompanyDto } from '../dto/UpdateCompany.dto';
import cloudinary from '../../../utils/cloudinary.config';
import * as streamifier from 'streamifier';
import { generateUniqueSlug } from '../../../utils/slug';

@Injectable()
export class CompaniesRepository {
  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
  ) {}

  // [GET] : /companies/:slug (Get company by slug - public)
  async getBySlug(slug: string): Promise<CompanyDocument | null> {
    return this.companyModel.findOne({ slug, deleted: { $ne: true } });
  }

  // [GET] : /companies (Get all companies)
  async getAll(): Promise<CompanyDocument[]> {
    return this.companyModel.find({ deleted: { $ne: true } }).exec();
  }

  // [GET] : /companies/:id (Get company by ID)
  async get(id: string): Promise<CompanyDocument | null> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid company ID');
    return this.companyModel.findOne({ _id: new Types.ObjectId(id), deleted: { $ne: true } });
  }

  // [POST] : /companies (Create new company)
  async create(dto: CreateCompanyDto): Promise<CompanyDocument> {
    const slug = await generateUniqueSlug<CompanyDocument>(this.companyModel as any, dto.name);
    const data = { ...dto, slug };
    
    // Convert createdBy string to ObjectId if present
    if (data.createdBy && Types.ObjectId.isValid(data.createdBy)) {
      data.createdBy = new Types.ObjectId(data.createdBy) as any;
    }
    
    return this.companyModel.create(data);
  }

  // [POST] : /companies (Create new company - legacy method for account-based creation)
  async createWithAccount(id: string, dto: CreateCompanyDto): Promise<CompanyDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid accountId');
    const accountId = new Types.ObjectId(id);
    return this.companyModel.create({ ...dto, accountId });
  }

  // [PATCH] : /companies/:id (Update company by ID)
  async update(id: string, dto: UpdateCompanyDto): Promise<CompanyDocument | null> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid company ID');
    const updateData: any = { ...dto };
    if (updateData.name) {
      updateData.slug = await generateUniqueSlug<CompanyDocument>(this.companyModel as any, updateData.name, id);
    }
    return this.companyModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deleted: { $ne: true } },
      { $set: updateData },
      { new: true }
    );
  }

  // [PATCH] : /companies/profile (Legacy method for account-based updates)
  async patch(id: string, dto: UpdateCompanyDto): Promise<CompanyDocument | null> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid accountId');
    const accountId = new Types.ObjectId(id);
    return this.companyModel.findOneAndUpdate(
      { accountId },
      { $set: dto },
      { new: true }
    );
  }

  // [DELETE] : /companies/:id (Delete company by ID)
  async deleteById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid company ID');
    return this.companyModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { deleted: true } }
    );
  }

  // [DELETE] : /companies/profile (soft delete)
  async delete(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid accountId');
    const accountId = new Types.ObjectId(id);
    return this.companyModel.updateOne({ accountId }, { $set: { deleted: true } });
  }

  // [POST] : /companies/:id/logo (Upload logo by company ID)
  async uploadLogoById(id: string, file: Express.Multer.File): Promise<any> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid company ID');
    
    try {
      // Upload to cloudinary
      const uploadResult = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: 'logos/companies',
            transformation: [
              { width: 500, height: 500, crop: 'fill' },
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

      // Update logo in database
      const updatedCompany = await this.companyModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deleted: { $ne: true } },
        { $set: { logo: uploadResult } },
        { new: true }
      );

      if (!updatedCompany) {
        throw new BadRequestException('Company not found');
      }

      return {
        success: true,
        message: 'Logo uploaded successfully',
        data: updatedCompany
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  // [POST] : /companies/profile/logo (Legacy method for account-based logo upload)
  async uploadLogo(id: string, file: Express.Multer.File): Promise<any> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid accountId');
    
    try {
      // Upload to cloudinary
      const uploadResult = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: 'logos/companies',
            transformation: [
              { width: 500, height: 500, crop: 'fill' },
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

      // Update logo in database
      const accountId = new Types.ObjectId(id);
      const updatedCompany = await this.companyModel.findOneAndUpdate(
        { accountId },
        { $set: { logo: uploadResult } },
        { new: true }
      );

      if (!updatedCompany) {
        throw new BadRequestException('Company not found');
      }

      return {
        success: true,
        message: 'Logo uploaded successfully',
        data: updatedCompany
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  // Add recruiter to company's recruiters list
  async addRecruiterToCompany(companyId: string, recruiterId: string): Promise<CompanyDocument | null> {
    if (!Types.ObjectId.isValid(companyId)) throw new BadRequestException('Invalid company ID');
    if (!Types.ObjectId.isValid(recruiterId)) throw new BadRequestException('Invalid recruiter ID');
    
    return this.companyModel.findOneAndUpdate(
      { _id: new Types.ObjectId(companyId), deleted: { $ne: true } },
      { $addToSet: { recruiters: new Types.ObjectId(recruiterId) } },
      { new: true }
    );
  }

  // Get companies by recruiter (created by recruiter or where recruiter is a member)
  async getByRecruiter(recruiterId: string): Promise<CompanyDocument[]> {
    if (!Types.ObjectId.isValid(recruiterId)) throw new BadRequestException('Invalid recruiter ID');
    const recruiterObjectId = new Types.ObjectId(recruiterId);
    return this.companyModel.find({ 
      deleted: { $ne: true },
      $or: [
        { createdBy: recruiterObjectId },
        { recruiters: recruiterObjectId }
      ]
    }).exec();
  }
}
