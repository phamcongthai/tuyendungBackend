import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RecruiterRepository } from './repositories/recruiters.repository';
import { CreateRecruiterDto } from './dto/create-recruiter.dto';
import { UpdateRecruiterDto } from './dto/update-recruiter.dto';
import { Types } from 'mongoose';

@Injectable()
export class RecruiterService {
  constructor(private readonly RecruiterRepository: RecruiterRepository) {}

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
