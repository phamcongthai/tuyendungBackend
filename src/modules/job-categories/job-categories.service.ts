import { Injectable } from '@nestjs/common';
import { JobCategoriesRepository } from './repositories/job-categories.repository';
import { CreateJobCategoryDto } from './dto/create-job-categories.dto';
import { UpdateJobCategoryDto } from './dto/update-job-categories.dto';

@Injectable()
export class JobCategoriesService {
  constructor(private readonly jobsRepo: JobCategoriesRepository) {}

  // [GET] : Lấy ra toàn bộ bản ghi
  async findAll(page: number, limit: number, search: string, status?: string) {
    return await this.jobsRepo.findAll(page, limit, search, status);
  }

  // [POST] : Tạo mới bản ghi
  async create(createJobDto: CreateJobCategoryDto) {
    return await this.jobsRepo.create(createJobDto);
  }

  // [PATCH] : Cập nhật bản ghi
  async update(id: string, updateJobDto: UpdateJobCategoryDto) {
    return await this.jobsRepo.update(id, updateJobDto);
  }

  // [GET] : Lấy ra chi tiết bản ghi
  async detail(id: string) {
    return await this.jobsRepo.detail(id);
  }

  // [PATCH] : Xóa bản ghi
  async delete(id: string) {
    return await this.jobsRepo.delete(id);
  }

  // [PATCH] : Thay đổi trạng thái active/inactive
  async toggleStatus(id: string) {
    return await this.jobsRepo.toggleStatus(id);
  }
}
