import { Injectable, BadRequestException } from '@nestjs/common';
import { CompaniesRepository } from './repositories/compannies.repository';
import { CreateCompanyDto } from './dto/CreateCompany.dto';
import { UpdateCompanyDto } from './dto/UpdateCompany.dto';
// import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recruiter, RecruiterDocument } from '../recruiters/schemas/recruiter.schema';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    // private readonly cloudinaryService: CloudinaryService,
    @InjectModel(Recruiter.name) private recruiterModel: Model<RecruiterDocument>,
  ) {}

  //[GET] : /companies/:id
  async get(companyId: string) {
    try {
      const company = await this.companiesRepository.get(companyId);
      if (!company) {
        return {
          success: false,
          message: 'Company not found',
          data: null
        };
      }
      return {
        success: true,
        message: 'Company retrieved successfully',
        data: company
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get company',
        data: null
      };
    }
  }

  //[GET] : /companies
  async getAll() {
    try {
      const companies = await this.companiesRepository.getAll();
      return {
        success: true,
        message: 'Companies retrieved successfully',
        data: companies
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get companies',
        data: null
      };
    }
  }

  //[POST] : /companies
  async create(dto: CreateCompanyDto) {
    try {
      const company = await this.companiesRepository.create(dto);
      // Gán companyId cho recruiter nếu có accountId trong dto (tuỳ logic hệ thống)
      // Nếu phía FE không gửi, bạn có thể gán trong controller theo req.user.id
      const accountId = (dto as any).accountId as string | undefined;
      if (accountId && Types.ObjectId.isValid(accountId)) {
        await this.recruiterModel.findOneAndUpdate(
          { accountId: new Types.ObjectId(accountId) },
          { $set: { companyId: company._id } },
          { new: true }
        );
      }
      return {
        success: true,
        message: 'Company created successfully',
        data: company
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create company',
        data: null
      };
    }
  }

  //[PATCH] : /companies/:id
  async patch(companyId: string, dto: UpdateCompanyDto) {
    try {
      const company = await this.companiesRepository.update(companyId, dto);
      if (!company) {
        return {
          success: false,
          message: 'Company not found',
          data: null
        };
      }
      return {
        success: true,
        message: 'Company updated successfully',
        data: company
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update company',
        data: null
      };
    }
  }

  //[DELETE] : /companies/:id
  async delete(companyId: string) {
    try {
      const result = await this.companiesRepository.deleteById(companyId);
      return {
        success: true,
        message: 'Company deleted successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete company',
        data: null
      };
    }
  }

  //[POST] : /companies/:id/logo
  async uploadLogo(companyId: string, file: Express.Multer.File) {
    return this.companiesRepository.uploadLogoById(companyId, file);
  }
}
