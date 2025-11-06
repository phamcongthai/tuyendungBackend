import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from './jobs.schema';
import { CreateJobDto } from './dto/request/create-job.dto';
import { UpdateJobDto } from './dto/request/update-job.dto';
import { buildNameSearchQuery } from 'src/utils/buildSearchQuery';
import cloudinary from '../../utils/cloudinary.config';
import * as streamifier from 'streamifier';
import { generateUniqueSlug } from '../../utils/slug';
import { JobsRepository } from './repositories/jobs.repository';
@Injectable()
export class JobsService {
    constructor(private readonly jobsRepo: JobsRepository) {}
 //[GET] : Lấy ra toàn bộ bản ghi 
  async findAll(
    page: number,
    limit: number,
    search: string,
    status?: string,
    jobType?: string,
    workingMode?: string,
    jobCategoryId?: string,
    location?: string,
    categories?: string[] | string,
    level?: string,
    salaryMin?: number,
    salaryMax?: number,
    experience?: string,
  ): Promise<{ data: Job[]; total: number }> {
    return await this.jobsRepo.findAll(page, limit, search, status, jobType, workingMode, jobCategoryId, categories, level, salaryMin, salaryMax, experience, location);
  }

  async findAllByRecruiter(
    recruiterId: string,
    page: number,
    limit: number,
    search: string,
    status?: string,
    jobType?: string,
    workingMode?: string,
    jobCategoryId?: string,
    location?: string,
    categories?: string[] | string,
    level?: string,
    salaryMin?: number,
    salaryMax?: number,
    experience?: string,
  ): Promise<{ data: Job[]; total: number }> {
    return await this.jobsRepo.findAllByRecruiter(
      recruiterId,
      page,
      limit,
      search,
      status,
      jobType,
      workingMode,
      jobCategoryId,
      categories,
      level,
      salaryMin,
      salaryMax,
      experience,
      location,
    );
  }
//[POST] : Tạo mới bản ghi
  async create(
    createJobDto: CreateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    return await this.jobsRepo.create(createJobDto, files);
  }

  //[PATCH] : Cập nhật bản ghi
  async update(
    id: string,
    updateJobDto: UpdateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    return await this.jobsRepo.update(id, updateJobDto, files);
  }

  // Removed removeImage method since images field is not in new Job schema
  // async removeImage(id: string, imageUrl: string): Promise<Job> {
  //   return await this.jobsRepo.removeImage(id, imageUrl);
  // }
  //[GET] : Lấy ra chi tiết bản ghi 
  async detail(id){
    return await this.jobsRepo.detail(id);
  }

  //[GET] : Lấy chi tiết bản ghi theo slug (public)
  async detailBySlug(slug: string){
    return await this.jobsRepo.findBySlug(slug);
  }
  //[PATCH] : Xóa bản ghi
  async delete(id){
    return await this.jobsRepo.delete(id);
  }

  //[PATCH] : Thay đổi trạng thái active/inactive
  async toggleStatus(id: string): Promise<Job> {
    return await this.jobsRepo.toggleStatus(id);
  }

  // ============ RECRUITER-SPECIFIC METHODS ============

  //[GET] : Lấy ra toàn bộ job của một recruiter cụ thể (xem phương thức phía trên có tham số location)

  //[POST] : Tạo mới job bởi recruiter
  async createByRecruiter(
    recruiterId: string,
    createJobDto: CreateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    return await this.jobsRepo.createByRecruiter(recruiterId, createJobDto, files);
  }

  //[PATCH] : Cập nhật job bởi recruiter (chỉ job của chính họ)
  async updateByRecruiter(
    recruiterId: string,
    id: string,
    updateJobDto: UpdateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    return await this.jobsRepo.updateByRecruiter(recruiterId, id, updateJobDto, files);
  }

  //[GET] : Lấy chi tiết job của recruiter
  async detailByRecruiter(recruiterId: string, id: string) {
    return await this.jobsRepo.detailByRecruiter(recruiterId, id);
  }

  //[PATCH] : Xóa job của recruiter (soft delete)
  async deleteByRecruiter(recruiterId: string, id: string) {
    return await this.jobsRepo.deleteByRecruiter(recruiterId, id);
  }

  //[PATCH] : Thay đổi trạng thái job của recruiter
  async toggleStatusByRecruiter(recruiterId: string, id: string): Promise<Job> {
    return await this.jobsRepo.toggleStatusByRecruiter(recruiterId, id);
  }
}
