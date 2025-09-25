import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from '../jobs.schema';
import { CreateJobDto } from '../dto/request/create-job.dto';
import { UpdateJobDto } from '../dto/request/update-job.dto';
import { buildNameSearchQuery } from 'src/utils/buildSearchQuery';
import cloudinary from '../../../utils/cloudinary.config';
import * as streamifier from 'streamifier';
import { generateUniqueSlug } from '../../../utils/slug';
import { RecruiterRepository } from '../../recruiters/repositories/recruiters.repository';

@Injectable()
export class JobsRepository {
  constructor(
    @InjectModel(Job.name) private jobsModel: Model<JobDocument>,
    private readonly recruiterRepository: RecruiterRepository,
    @InjectModel('Application') private applicationModel: Model<any>,
  ) {}

  //[GET] : Lấy ra toàn bộ bản ghi 
  async findAll(
    page: number,
    limit: number,
    search: string,
    status?: string,
    jobType?: string,
    workingMode?: string,
    jobCategoryId?: string,
  ): Promise<{ data: Job[]; total: number }> {
    const query: any = {
      ...buildNameSearchQuery(search),
      deleted: false,
    };

    // Filter by status if provided (draft | active | expired)
    if (status) {
      const normalized = status.toLowerCase();
      if (['draft', 'active', 'expired'].includes(normalized)) {
        query.status = normalized;
      }
    }

    // Filter by jobType if provided
    if (jobType) {
      query.jobType = jobType;
    }

    // Filter by workingMode if provided
    if (workingMode) {
      query.workingMode = workingMode;
    }

    // Filter by jobCategoryId if provided
    if (jobCategoryId) {
      query.jobCategoryId = jobCategoryId;
    }

    const data = await this.jobsModel
      .find(query)
      .populate({ 
        path: 'companyId', 
        select: 'name slug logo size address industries website description foundedYear'
      })
      .populate({ path: 'jobCategoryId', select: 'title slug description' })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1, _id: 1 })
      .exec();

    const total = await this.jobsModel.countDocuments(query);

    // Attach applicationCount per job
    const jobIds = data.map((j: any) => j._id);
    const counts = await this.applicationModel.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } }
    ]);
    const countMap = new Map<string, number>(counts.map((c: any) => [String(c._id), c.count]));
    const dataWithCounts = data.map((j: any) => {
      const obj = typeof j.toObject === 'function' ? j.toObject() : { ...j };
      obj.applicationCount = countMap.get(String(j._id)) || 0;
      return obj;
    });

    return { data: dataWithCounts as any, total };
  }

  //[POST] : Tạo mới bản ghi
  async create(
    createJobDto: CreateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    try {
      // Validate required refs for admin-created jobs
      if (!createJobDto.companyId) {
        throw new BadRequestException('companyId is required');
      }
      if (!createJobDto.recruiterId) {
        throw new BadRequestException('recruiterId is required');
      }
      // Remove image upload functionality since not in new schema
      // Upload ảnh nếu có
      // let uploadedImages: string[] = [];
      // if (files && files.length > 0) {
      //   uploadedImages = await Promise.all(...)
      // }

      // Tạo slug duy nhất từ title
      const slug = await generateUniqueSlug<JobDocument>(this.jobsModel as any, createJobDto.title);

      // Tạo job mới với slug và convert ObjectIds
      const newJob = new this.jobsModel({
        ...createJobDto,
        recruiterId: new Types.ObjectId(createJobDto.recruiterId),
        companyId: new Types.ObjectId(createJobDto.companyId),
        jobCategoryId: createJobDto.jobCategoryId ? new Types.ObjectId(createJobDto.jobCategoryId) : undefined,
        slug,
      });

      return await newJob.save();
    } catch (error) {
      throw new BadRequestException(`Không thể tạo job: ${error.message}`);
    }
  }

  //[PATCH] : Cập nhật bản ghi
  async update(
    id: string,
    updateJobDto: UpdateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    try {
      const existingJob = await this.jobsModel.findById(id);
      if (!existingJob) {
        throw new BadRequestException('Không tìm thấy công việc');
      }

      // Remove image upload functionality since not in new schema  
      // Upload ảnh mới nếu có
      // let newImages: string[] = [];
      // if (files && files.length > 0) {
      //   newImages = await Promise.all(...)
      // }

      const updateData = { ...updateJobDto } as any;

      // Reject attempts to null-out required references
      if (Object.prototype.hasOwnProperty.call(updateData, 'companyId') && !updateData.companyId) {
        throw new BadRequestException('companyId cannot be null or empty');
      }
      if (Object.prototype.hasOwnProperty.call(updateData, 'recruiterId') && !updateData.recruiterId) {
        throw new BadRequestException('recruiterId cannot be null or empty');
      }

      // Xử lý deadline nếu có
      if (updateData.deadline) {
        updateData.deadline = new Date(updateData.deadline);
      }

      // Convert ObjectIds nếu có
      if (updateData.recruiterId) {
        updateData.recruiterId = new Types.ObjectId(updateData.recruiterId);
      }
      if (updateData.companyId) {
        updateData.companyId = new Types.ObjectId(updateData.companyId);
      }
      if (updateData.jobCategoryId) {
        updateData.jobCategoryId = new Types.ObjectId(updateData.jobCategoryId);
      }

      // Nếu có cập nhật title, cập nhật slug mới
      if (updateData.title) {
        updateData.slug = await generateUniqueSlug<JobDocument>(this.jobsModel as any, updateData.title, id);
      }

      const updatedJob = await this.jobsModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!updatedJob) {
        throw new BadRequestException('Không thể cập nhật công việc');
      }

      return updatedJob;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Lỗi khi cập nhật công việc: ${error.message}`);
    }
  }

  // Removed removeImage method since images field is not in new Job schema
  // async removeImage(id: string, imageUrl: string): Promise<Job> {
  //   ...
  // }

  async detail(id: string) {
    try {
      console.log('🔍 Looking up job with id:', id);
      
      const job = await this.jobsModel.findById(id)
        .populate({ 
          path: 'companyId', 
          select: 'name slug logo size address industries website description foundedYear'
        })
        .populate({ path: 'jobCategoryId', select: 'title slug description' });
      
      console.log('📋 Job found:', !!job);
      if (job) {
        console.log('📋 Job recruiterId raw:', job.recruiterId);
        console.log('📋 Job recruiterId type:', typeof job.recruiterId);
        console.log('📋 Job populated successfully');
      } else {
        console.log('❌ Job not found');
      }
      
      return job;
    } catch (error) {
      console.error('❌ Error in job detail lookup:', error);
      throw error;
    }
  }

  async findBySlug(slug: string) {
    // In case of accidental duplicate slugs, prefer the most recently created
    return await this.jobsModel
      .findOne({ slug, deleted: false })
      .sort({ createdAt: -1 })
      .populate({ 
        path: 'companyId', 
        select: 'name slug logo size address industries website description foundedYear'
      })
      .populate({ path: 'jobCategoryId', select: 'title slug description' });
  }

  async delete(id: string) {
    return await this.jobsModel.updateOne({ _id: id }, { deleted: true });
  }

  async toggleStatus(id: string): Promise<Job> {
    try {
      const job = await this.jobsModel.findById(id);
      if (!job) {
        throw new BadRequestException('Không tìm thấy công việc');
      }

      const newStatus = job.status === 'active' ? 'draft' : 'active';

      const updatedJob = await this.jobsModel.findByIdAndUpdate(
        id,
        { 
          status: newStatus
        },
        { new: true }
      );

      if (!updatedJob) {
        throw new BadRequestException('Không thể cập nhật trạng thái');
      }

      return updatedJob;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Lỗi khi thay đổi trạng thái: ${error.message}`);
    }
  }

  // ============ RECRUITER-SPECIFIC METHODS ============

  //[GET] : Lấy ra toàn bộ job của một recruiter cụ thể
  async findAllByRecruiter(
    recruiterId: string,
    page: number,
    limit: number,
    search: string,
    status?: string,
    jobType?: string,
    workingMode?: string,
    jobCategoryId?: string,
  ): Promise<{ data: Job[]; total: number }> {
    const query: any = {
      ...buildNameSearchQuery(search),
      recruiterId: new Types.ObjectId(recruiterId),
      deleted: false,
    };

    // Filter by status if provided (draft | active | expired)
    if (status) {
      const normalized = status.toLowerCase();
      if (['draft', 'active', 'expired'].includes(normalized)) {
        query.status = normalized;
      }
    }

    // Filter by jobType if provided
    if (jobType) {
      query.jobType = jobType;
    }

    // Filter by workingMode if provided
    if (workingMode) {
      query.workingMode = workingMode;
    }

    // Filter by jobCategoryId if provided
    if (jobCategoryId) {
      query.jobCategoryId = jobCategoryId;
    }

    const data = await this.jobsModel
      .find(query)
      .populate({ path: 'companyId', select: 'name slug logo' })
      .populate({ path: 'jobCategoryId', select: 'title slug description' })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1, _id: 1 })
      .exec();

    const total = await this.jobsModel.countDocuments(query);

    // Attach applicationCount per job for recruiter view
    const jobIds = data.map((j: any) => j._id);
    const counts = await this.applicationModel.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } }
    ]);
    const countMap = new Map<string, number>(counts.map((c: any) => [String(c._id), c.count]));
    const dataWithCounts = data.map((j: any) => {
      const obj = typeof j.toObject === 'function' ? j.toObject() : { ...j };
      obj.applicationCount = countMap.get(String(j._id)) || 0;
      return obj;
    });

    return { data: dataWithCounts as any, total };
  }

  //[POST] : Tạo mới job bởi recruiter
  async createByRecruiter(
    recruiterId: string,
    createJobDto: CreateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    try {
      // Lấy thông tin recruiter để có companyId
      const recruiter = await this.recruiterRepository.get(recruiterId);
      if (!recruiter) {
        throw new BadRequestException('Không tìm thấy thông tin recruiter');
      }
      if (!recruiter.companyId) {
        throw new BadRequestException('Bạn cần tạo/cập nhật thông tin công ty trước khi đăng tin tuyển dụng');
      }

      // Sinh slug từ title và đảm bảo unique
      const slug = await generateUniqueSlug<JobDocument>(this.jobsModel as any, createJobDto.title);

      // Tạo job mới với recruiterId, companyId và slug
      const newJob = new this.jobsModel({
        ...createJobDto,
        recruiterId: new Types.ObjectId(recruiterId),
        companyId: recruiter.companyId,
        slug,
      });

      return await newJob.save();
    } catch (error) {
      throw new BadRequestException(`Không thể tạo job: ${error.message}`);
    }
  }

  //[PATCH] : Cập nhật job bởi recruiter (chỉ job của chính họ)
  async updateByRecruiter(
    recruiterId: string,
    id: string,
    updateJobDto: UpdateJobDto,
    files?: Express.Multer.File[],
  ): Promise<Job> {
    try {
      const existingJob = await this.jobsModel.findOne({ 
        _id: id, 
        recruiterId: new Types.ObjectId(recruiterId),
        deleted: false 
      });
      
      if (!existingJob) {
        throw new BadRequestException('Không tìm thấy công việc hoặc bạn không có quyền chỉnh sửa');
      }

      const updateData = { ...updateJobDto } as any;

      // Xử lý deadline nếu có
      if (updateData.deadline) {
        updateData.deadline = new Date(updateData.deadline);
      }

      // Nếu đổi title, cập nhật slug theo title mới (vẫn giữ unique)
      if (updateData.title) {
        updateData.slug = await generateUniqueSlug<JobDocument>(this.jobsModel as any, updateData.title, id);
      }

      const updatedJob = await this.jobsModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate({ 
        path: 'companyId', 
        select: 'name slug logo size address industries website description foundedYear'
       })
       .populate({ path: 'jobCategoryId', select: 'title slug description' });

      if (!updatedJob) {
        throw new BadRequestException('Không thể cập nhật công việc');
      }

      return updatedJob;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Lỗi khi cập nhật công việc: ${error.message}`);
    }
  }

  //[GET] : Lấy chi tiết job của recruiter
  async detailByRecruiter(recruiterId: string, id: string) {
    const job = await this.jobsModel.findOne({
      _id: id,
      recruiterId: new Types.ObjectId(recruiterId),
      deleted: false
    })
    .populate({ 
      path: 'companyId', 
      select: 'name slug logo size address industries website description foundedYear'
    })
    .populate({ path: 'jobCategoryId', select: 'title slug description' });

    if (!job) {
      throw new BadRequestException('Không tìm thấy công việc hoặc bạn không có quyền xem');
    }

    return job;
  }

  //[PATCH] : Xóa job của recruiter (soft delete)
  async deleteByRecruiter(recruiterId: string, id: string) {
    const job = await this.jobsModel.findOne({
      _id: id,
      recruiterId: new Types.ObjectId(recruiterId),
      deleted: false
    });

    if (!job) {
      throw new BadRequestException('Không tìm thấy công việc hoặc bạn không có quyền xóa');
    }

    return await this.jobsModel.updateOne({ _id: id }, { deleted: true });
  }

  //[PATCH] : Thay đổi trạng thái job của recruiter
  async toggleStatusByRecruiter(recruiterId: string, id: string): Promise<Job> {
    try {
      const job = await this.jobsModel.findOne({
        _id: id,
        recruiterId: new Types.ObjectId(recruiterId),
        deleted: false
      });

      if (!job) {
        throw new BadRequestException('Không tìm thấy công việc hoặc bạn không có quyền chỉnh sửa');
      }

      const newStatus = job.status === 'active' ? 'draft' : 'active';

      const updatedJob = await this.jobsModel.findByIdAndUpdate(
        id,
        { 
          status: newStatus
        },
        { new: true }
      ).populate({ 
        path: 'companyId', 
        select: 'name slug logo size address industries website description foundedYear'
       })
       .populate({ path: 'jobCategoryId', select: 'title slug description' });

      if (!updatedJob) {
        throw new BadRequestException('Không thể cập nhật trạng thái');
      }

      return updatedJob;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Lỗi khi thay đổi trạng thái: ${error.message}`);
    }
  }
}