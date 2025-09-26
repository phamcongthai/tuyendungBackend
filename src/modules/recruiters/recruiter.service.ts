import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecruiterRepository } from './repositories/recruiters.repository';
import { CreateRecruiterDto } from './dto/create-recruiter.dto';
import { UpdateRecruiterDto } from './dto/update-recruiter.dto';
import { Types } from 'mongoose';
import { Recruiter, RecruiterDocument } from './schemas/recruiter.schema';

@Injectable()
export class RecruiterService implements OnModuleInit {
  constructor(
    private readonly RecruiterRepository: RecruiterRepository,
    @InjectModel(Recruiter.name) private readonly recruiterModel: Model<RecruiterDocument>,
  ) {}

  async onModuleInit() {
    // Drop legacy unique indexes (username/email) on recruiter collection if any remain
    try {
      const indexes = await this.recruiterModel.collection.indexes();
      const legacyEmail = indexes.find((i: any) => i?.name === 'email_1');
      if (legacyEmail) {
        await this.recruiterModel.collection.dropIndex('email_1');
        // eslint-disable-next-line no-console
        console.log('[RecruiterService] Dropped legacy index email_1');
      }
      for (const idx of indexes) {
        try {
          const key = (idx as any)?.key || {};
          const name = (idx as any)?.name;
          if ((key && (key.username || key.email)) && name && name !== 'accountId_1') {
            await this.recruiterModel.collection.dropIndex(name);
            // eslint-disable-next-line no-console
            console.log('[RecruiterService] Dropped legacy index', name);
          }
        } catch {}
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.warn('[RecruiterService] Could not drop legacy recruiter indexes:', e?.message || e);
    }
  }

  //[GET] : /recruiters/profile 
  async get(accountId: string) {
    const recruiter = await this.RecruiterRepository.get(accountId);
    if (!recruiter) {
      return {
        success: false,
        message: 'Profile not found',
        data: null
      };
    }
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: recruiter
    };
  }

  //[GET] : /recruiters/profile/ensure (Ensure recruiter profile exists)
  async ensureProfileExists(accountId: string) {
    const recruiter = await this.RecruiterRepository.get(accountId);
    if (!recruiter) {
      // Tạo recruiter profile rỗng nếu chưa có
      const newRecruiter = await this.RecruiterRepository.createEmpty(accountId);
      return {
        success: true,
        message: 'Profile created successfully',
        data: newRecruiter
      };
    }
    return {
      success: true,
      message: 'Profile already exists',
      data: recruiter
    };
  }

  //[GET] : /recruiters (Get all recruiters - for admin purposes)
  async getAll() {
    const recruiters = await this.RecruiterRepository.getAll();
    return {
      success: true,
      message: 'Recruiters retrieved successfully',
      data: recruiters
    };
  }

  //[GET] : /recruiters/company/:companyId (Get recruiters by company)
  async getByCompany(companyId: string) {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    
    const recruiters = await this.RecruiterRepository.getByCompany(companyId);
    return {
      success: true,
      message: 'Company recruiters retrieved successfully',
      data: recruiters
    };
  }

  //[POST] : /recruiters/profile
  async create(accountId: string, dto: CreateRecruiterDto) {
    // Validate that company exists
    if (!Types.ObjectId.isValid(dto.companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    
    const recruiter = await this.RecruiterRepository.create(accountId, dto);
    return {
      success: true,
      message: 'Profile created successfully',
      data: recruiter
    };
  }

  //[PATCH] : /recruiters/profile
  async patch(accountId: string, dto: UpdateRecruiterDto) {
    // Validate company ID if provided
    if (dto.companyId && !Types.ObjectId.isValid(dto.companyId)) {
      throw new BadRequestException('Invalid company ID');
    }
    
    const result = await this.RecruiterRepository.patch(accountId, dto);
    if (!result || result.modifiedCount === 0) {
      return {
        success: false,
        message: 'No profile found to update or no changes made',
        data: null
      };
    }

    // Get updated profile
    const updatedProfile = await this.RecruiterRepository.get(accountId);
    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    };
  }

  //[DELETE] : /recruiters/profile (Soft delete)
  async delete(accountId: string) {
    const result = await this.RecruiterRepository.delete(accountId);
    if (!result || result.modifiedCount === 0) {
      return {
        success: false,
        message: 'No profile found to delete',
        data: null
      };
    }
    
    return {
      success: true,
      message: 'Profile deleted successfully',
      data: result
    };
  }

  //[POST] : /recruiters/profile/avatar
  async uploadAvatar(accountId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    
    const result = await this.RecruiterRepository.uploadAvatar(accountId, file);
    return {
      success: true,
      message: 'Avatar uploaded successfully',
      data: result
    };
  }

  //[PATCH] : /recruiters/:id/status (Update recruiter status - admin only)
  async updateStatus(recruiterId: string, isActive: boolean) {
    if (!Types.ObjectId.isValid(recruiterId)) {
      throw new BadRequestException('Invalid recruiter ID');
    }
    
    const result = await this.RecruiterRepository.updateStatus(recruiterId, isActive);
    if (!result) {
      throw new NotFoundException('Recruiter not found');
    }
    
    return {
      success: true,
      message: 'Recruiter status updated successfully',
      data: result
    };
  }
}
