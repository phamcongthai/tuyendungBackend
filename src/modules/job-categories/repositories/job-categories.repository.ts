import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  JobCategories,
  JobCategoriesDocument,
  JobCategoriesStatus,
} from '../job-categories.schema';
import { CreateJobCategoryDto } from '../dto/create-job-categories.dto';
import { UpdateJobCategoryDto } from '../dto/update-job-categories.dto';
import { generateUniqueSlug } from 'src/utils/slug';

@Injectable()
export class JobCategoriesRepository {
  constructor(
    @InjectModel(JobCategories.name)
    private jobCategoriesModel: Model<JobCategoriesDocument>,
  ) {}

  // [GET] Lấy danh sách với phân trang + tìm kiếm + filter status
  async findAll(
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ) {
    const query: any = { deleted: false };

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    if (status) {
      query.status = status;
    } else {
      query.status = JobCategoriesStatus.ACTIVE;
    }

    const data = await this.jobCategoriesModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.jobCategoriesModel.countDocuments(query);

    return { data, total };
  }

  // [POST] Tạo mới category
  async create(createDto: CreateJobCategoryDto) {
    try {
      const slug = await generateUniqueSlug<JobCategoriesDocument>(
        this.jobCategoriesModel,
        createDto.title,
      );

      const newCategory = new this.jobCategoriesModel({
        ...createDto,
        slug,
        status: createDto.status || JobCategoriesStatus.ACTIVE,
      });

      return await newCategory.save();
    } catch (error) {
      throw new BadRequestException(
        `Không thể tạo category: ${error.message}`,
      );
    }
  }

  // [PATCH] Cập nhật category
  async update(id: string, updateDto: UpdateJobCategoryDto) {
    try {
      const existingCategory = await this.jobCategoriesModel.findById(id);
      if (!existingCategory) {
        throw new BadRequestException('Không tìm thấy category');
      }

      if (updateDto.title) {
        updateDto.slug = await generateUniqueSlug(
          this.jobCategoriesModel,
          updateDto.title,
          id,
        );
      }

      const updatedCategory = await this.jobCategoriesModel.findByIdAndUpdate(
        id,
        updateDto,
        { new: true, runValidators: true },
      );

      if (!updatedCategory) {
        throw new BadRequestException('Không thể cập nhật category');
      }

      return updatedCategory;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Lỗi khi cập nhật category: ${error.message}`,
      );
    }
  }

  // [GET] Chi tiết category
  async detail(id: string) {
    return await this.jobCategoriesModel.findById(id).exec();
  }

  // [PATCH] Soft delete
  async delete(id: string) {
    return await this.jobCategoriesModel
      .findByIdAndUpdate(id, { deleted: true }, { new: true })
      .exec();
  }

  // [PATCH] Toggle trạng thái ACTIVE/INACTIVE
  async toggleStatus(id: string) {
    try {
      const category = await this.jobCategoriesModel.findById(id);
      if (!category) throw new BadRequestException('Không tìm thấy category');

      const newStatus =
        category.status === JobCategoriesStatus.ACTIVE
          ? JobCategoriesStatus.INACTIVE
          : JobCategoriesStatus.ACTIVE;

      const updatedCategory = await this.jobCategoriesModel.findByIdAndUpdate(
        id,
        { status: newStatus },
        { new: true },
      );

      if (!updatedCategory)
        throw new BadRequestException('Không thể cập nhật trạng thái');

      return updatedCategory;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Lỗi khi thay đổi trạng thái: ${error.message}`,
      );
    }
  }

  // [GET] Tìm category theo slug
  async findBySlug(slug: string) {
    return await this.jobCategoriesModel.findOne({ slug, deleted: false }).exec();
  }
}
