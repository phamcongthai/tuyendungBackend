import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompaniesRepository } from '../repositories/compannies.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../schemas/company.schema';

@ApiTags('Companies - Public')
@Controller('companies')
export class PublicCompaniesController {
  constructor(
    private readonly companiesRepo: CompaniesRepository,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  @ApiOperation({ summary: 'Get company by slug (public)' })
  @ApiParam({ name: 'slug', type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const company = await this.companiesRepo.getBySlug(slug);
    if (!company) throw new NotFoundException('Company not found');
    // Return only public-safe fields
    const {
      _id,
      name,
      slug: companySlug,
      logo,
      size,
      address,
      email,
      phone,
      industries,
      website,
      description,
      foundedYear,
      taxCode,
    } = company as any;
    return {
      _id,
      name,
      slug: companySlug,
      logo,
      size,
      address,
      location: address,
      email,
      phone,
      industries,
      website,
      description,
      foundedYear,
      taxCode,
    };
  }

  @ApiOperation({ summary: 'Get total companies count (public)' })
  @Get('count')
  async count() {
    const total = await this.companyModel.countDocuments({ deleted: { $ne: true } });
    return { total };
  }

  @ApiOperation({ summary: 'Get company by slug (public, explicit path)' })
  @ApiParam({ name: 'slug', type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @Get('slug/:slug')
  async getBySlugExplicit(@Param('slug') slug: string) {
    const company = await this.companiesRepo.getBySlug(slug);
    if (!company) throw new NotFoundException('Company not found');
    const {
      _id,
      name,
      slug: companySlug,
      logo,
      size,
      address,
      email,
      phone,
      industries,
      website,
      description,
      foundedYear,
      taxCode,
    } = company as any;
    return {
      _id,
      name,
      slug: companySlug,
      logo,
      size,
      address,
      location: address,
      email,
      phone,
      industries,
      website,
      description,
      foundedYear,
      taxCode,
    };
  }

  @ApiOperation({ summary: 'Get company by id (public)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @Get('id/:id')
  async getById(@Param('id') id: string) {
    const company = await this.companiesRepo.get(id);
    if (!company) throw new NotFoundException('Company not found');
    const {
      _id,
      name,
      slug: companySlug,
      logo,
      size,
      address,
      industries,
      website,
      description,
      foundedYear,
    } = company as any;
    return {
      _id,
      name,
      slug: companySlug,
      logo,
      size,
      location: address,
      industries,
      website,
      description,
      foundedYear,
    };
  }
}


