import { Injectable, BadRequestException } from '@nestjs/common';
import { CompaniesRepository } from './repositories/compannies.repository';
import { CreateCompanyDto } from './dto/CreateCompany.dto';
import { UpdateCompanyDto } from './dto/UpdateCompany.dto';
// import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recruiter, RecruiterDocument } from '../recruiters/schemas/recruiter.schema';
import { Account, AccountsDocument } from '../accounts/schema/account.schema';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    // private readonly cloudinaryService: CloudinaryService,
    @InjectModel(Recruiter.name) private recruiterModel: Model<RecruiterDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountsDocument>,
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
      const accountId = (dto as any).accountId as string | undefined;
      let recruiterId: string | undefined;

      // Tìm recruiter từ accountId để lấy recruiterId
      if (accountId && Types.ObjectId.isValid(accountId)) {
        let recruiter = await this.recruiterModel.findOne({
          accountId: new Types.ObjectId(accountId)
        });
        
        // Nếu chưa có recruiter profile, tạo một profile rỗng
        if (!recruiter) {
          console.log('Creating empty recruiter profile for account:', accountId);
          
          // Lấy thông tin account để có email
          const account = await this.accountModel.findById(accountId);
          
          recruiter = await this.recruiterModel.create({
            accountId: new Types.ObjectId(accountId),
            email: account?.email, // Set email để tránh duplicate key error
            companyRole: 'member',
            isActive: true,
            deleted: false,
            position: undefined,
            gender: undefined,
            province: undefined,
            district: undefined,
            avatar: null,
          });
        }
        
        if (recruiter) {
          recruiterId = (recruiter._id as Types.ObjectId).toString();
        }
      }

      // Kiểm tra recruiterId trước khi tạo company
      if (!recruiterId) {
        return {
          success: false,
          message: 'Recruiter not found. Please ensure you have a valid recruiter profile.',
          data: null
        };
      }

      // Tạo company với createdBy
      const companyData = {
        ...dto,
        createdBy: recruiterId
      };
      
      console.log('Creating company with data:', companyData);
      const company = await this.companiesRepository.create(companyData);
      console.log('Company created:', company);

      // Gán companyId cho recruiter và thêm recruiter vào danh sách recruiters của company
      if (accountId && Types.ObjectId.isValid(accountId) && recruiterId) {
        await this.recruiterModel.findOneAndUpdate(
          { accountId: new Types.ObjectId(accountId) },
          { $set: { companyId: company._id } },
          { new: true }
        );

        // Thêm recruiter vào danh sách recruiters của company
        await this.companiesRepository.addRecruiterToCompany((company._id as Types.ObjectId).toString(), recruiterId);
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

  //[POST] : /companies/:id/background
  async uploadBackground(companyId: string, file: Express.Multer.File) {
    return this.companiesRepository.uploadBackgroundById(companyId, file);
  }

  //[GET] : /companies/my (Get companies created by current recruiter)
  async getMyCompanies(accountId: string) {
    try {
      // Tìm recruiter từ accountId
      const recruiter = await this.recruiterModel.findOne({
        accountId: new Types.ObjectId(accountId)
      });

      if (!recruiter) {
        return {
          success: false,
          message: 'Recruiter not found',
          data: []
        };
      }

      // Lấy companies do recruiter này tạo
      const companies = await this.companiesRepository.getByRecruiter((recruiter._id as Types.ObjectId).toString());
      
      return {
        success: true,
        message: 'Companies retrieved successfully',
        data: companies
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get companies',
        data: []
      };
    }
  }
}
