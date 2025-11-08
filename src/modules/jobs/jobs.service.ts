import { Injectable } from '@nestjs/common';
import { Job } from './jobs.schema';
import { CreateJobDto } from './dto/request/create-job.dto';
import { UpdateJobDto } from './dto/request/update-job.dto';
import { JobsRepository } from './repositories/jobs.repository';
 

@Injectable()
export class JobsService {
  constructor(private readonly jobsRepo: JobsRepository) {}

  // [GET] : Lấy ra toàn bộ bản ghi 
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
    featured?: boolean,
  ): Promise<{ data: Job[]; total: number }> {
    return await this.jobsRepo.findAll(
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
      featured,
    );
  }

  // [GET] : Lấy job theo recruiter (thực ra là accountId)
  async findAllByRecruiter(
    recruiterId: string,
    page: number,
    limit: number,
    search: string,
    status?: string,
    jobType?: string,
    workingMode?: string,
    jobCategoryId?: string,
    categories?: string[] | string,
    level?: string,
    salaryMin?: number,
    salaryMax?: number,
    experience?: string,
    location?: string,
    featured?: boolean,
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
      featured,
    );
  }

  // [POST] : Tạo mới bản ghi
  async create(
    createJobDto: CreateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    return await this.jobsRepo.create(createJobDto, files);
  }

  // [PATCH] : Cập nhật bản ghi
  async update(
    id: string,
    updateJobDto: UpdateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    return await this.jobsRepo.update(id, updateJobDto, files);
  }

  // [GET] : Lấy ra chi tiết bản ghi 
  async detail(id: string) {
    return await this.jobsRepo.detail(id);
  }

  // [GET] : Lấy chi tiết bản ghi theo slug (public)
  async detailBySlug(slug: string) {
    return await this.jobsRepo.findBySlug(slug);
  }

  // [PATCH] : Xóa bản ghi
  async delete(id: string) {
    return await this.jobsRepo.delete(id);
  }

  // [PATCH] : Thay đổi trạng thái active/inactive
  async toggleStatus(id: string): Promise<Job> {
    return await this.jobsRepo.toggleStatus(id);
  }

  // ================= RECRUITER METHODS =================

  // [POST] : Tạo mới job bởi recruiter (recruiterId là accountId)
  async createByRecruiter(
    recruiterId: string,
    createJobDto: CreateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    return await this.jobsRepo.createByRecruiter(recruiterId, createJobDto, files);
  }

  // [PATCH] : Cập nhật job bởi recruiter
  async updateByRecruiter(
    recruiterId: string,
    id: string,
    updateJobDto: UpdateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    return await this.jobsRepo.updateByRecruiter(
      recruiterId,
      id,
      updateJobDto,
      files,
    );
  }

  // [GET] : Lấy chi tiết job của recruiter
  async detailByRecruiter(recruiterId: string, id: string) {
    return await this.jobsRepo.detailByRecruiter(recruiterId, id);
  }

  // [PATCH] : Xóa job của recruiter
  async deleteByRecruiter(recruiterId: string, id: string) {
    return await this.jobsRepo.deleteByRecruiter(recruiterId, id);
  }

  // [PATCH] : Thay đổi trạng thái job của recruiter
  async toggleStatusByRecruiter(recruiterId: string, id: string): Promise<Job> {
    return await this.jobsRepo.toggleStatusByRecruiter(recruiterId, id);
  }
}
