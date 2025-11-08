import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from '../jobs.schema';
import { CreateJobDto } from '../dto/request/create-job.dto';
import { UpdateJobDto } from '../dto/request/update-job.dto';
import { Company } from '../../companies/schemas/company.schema';
import { JobCategories } from '../../job-categories/job-categories.schema';
import cloudinary from '../../../utils/cloudinary.config';
import * as streamifier from 'streamifier';
import { generateUniqueSlug } from '../../../utils/slug';
import { RecruiterRepository } from '../../recruiters/repositories/recruiters.repository';

@Injectable()
export class JobsRepository {
  constructor(
    @InjectModel(Job.name) private jobsModel: Model<JobDocument>,
    @InjectModel(Company.name) private companyModel: Model<any>,
    @InjectModel(JobCategories.name) private jobCategoriesModel: Model<any>,
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
    categories?: string[] | string,
    level?: string,
    salaryMin?: number,
    salaryMax?: number,
    experience?: string,
    location?: string,
    featured?: boolean,
  ): Promise<{ data: Job[]; total: number }> {
    const query: any = { deleted: false };

    // Free-text regex across multiple fields (jobs + company name)
    if (search && String(search).trim().length > 0) {
      const buildViRegex = (raw: string) => {
        const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const map: Record<string, string> = {
          a: 'aàáạảãâầấậẩẫăằắặẳẵ',
          e: 'eèéẹẻẽêềếệểễ',
          i: 'iìíịỉĩ',
          o: 'oòóọỏõôồốộổỗơờớợởỡ',
          u: 'uùúụủũưừứựửữ',
          y: 'yỳýỵỷỹ',
          d: 'dđ',
        };
        const toClass = (ch: string) => {
          const lower = ch.toLowerCase();
          if (map[lower]) {
            const cls = map[lower];
            const full = cls + cls.toUpperCase();
            return `[${full}]`;
          }
          if (/[\s_-]/.test(ch)) return '.*';
          return escapeRegExp(ch);
        };
        const pattern = Array.from(raw).map(toClass).join('');
        return new RegExp(pattern, 'i');
      };
      const viRe = buildViRegex(String(search).trim());
      const regex = { $regex: viRe } as any;
      // Find companyIds whose name matches
      let companyIds: Types.ObjectId[] = [] as any;
      try {
        const matchedCompanies = await this.companyModel.find({ name: regex as any }).select('_id');
        companyIds = matchedCompanies.map((c: any) => new Types.ObjectId(String(c._id)));
      } catch {}
      query.$or = [
        { title: regex },
        { description: regex },
        { requirements: regex },
        { benefits: regex },
        { skills: regex },
        { location: regex },
        { levelVi: regex },
        { levelEn: regex },
        { education: regex },
        ...(companyIds.length ? [{ companyId: { $in: companyIds } }] : []),
      ];
    }

    if (location && String(location).trim().length > 0) {
      query.location = { $regex: String(location).trim(), $options: 'i' };
    }

    // Categories by titles -> resolve to ids
    if (categories && (Array.isArray(categories) || String(categories).trim().length > 0)) {
      const cats = Array.isArray(categories)
        ? categories
        : String(categories).split(',').map((s) => s.trim()).filter(Boolean);
      if (cats.length) {
        const or = cats.map((c) => ({ title: { $regex: new RegExp(c, 'i') } }));
        const list = await this.jobCategoriesModel.find({ $or: or }).select('_id');
        const ids = list.map((d: any) => new Types.ObjectId(String(d._id)));
        if (ids.length) query.jobCategoryId = { $in: ids };
      }
    }

    // Level filter: matches vi/en
    if (level && String(level).trim()) {
      const re = new RegExp(String(level).trim(), 'i');
      query.$and = [...(query.$and || []), { $or: [{ levelVi: re }, { levelEn: re }] }];
    }

    // Experience heuristics: match in requirements/description
    if (experience && String(experience).trim()) {
      const re = new RegExp(String(experience).trim(), 'i');
      query.$and = [...(query.$and || []), { $or: [{ requirements: re }, { description: re }] }];
    }

    // Salary range overlap
    if (typeof salaryMin === 'number' || typeof salaryMax === 'number') {
      const min = typeof salaryMin === 'number' ? salaryMin : 0;
      const max = typeof salaryMax === 'number' ? salaryMax : Number.MAX_SAFE_INTEGER;
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { isSalaryNegotiable: true },
            { $and: [ { salaryMin: { $lte: max } }, { salaryMax: { $gte: min } } ] },
          ],
        },
      ];
    }

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

    // Featured filter
    if (typeof featured === 'boolean') {
      if (featured) query.isFeatured = true;
      else query.isFeatured = { $ne: true };
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
      // Prevent recruiters from toggling featured fields directly
      if (Object.prototype.hasOwnProperty.call(updateData, 'isFeatured')) delete updateData.isFeatured;
      if (Object.prototype.hasOwnProperty.call(updateData, 'featuredPackageId')) delete updateData.featuredPackageId;

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
    categories?: string[] | string,
    level?: string,
    salaryMin?: number,
    salaryMax?: number,
    experience?: string,
    location?: string,
    featured?: boolean,
  ): Promise<{ data: Job[]; total: number }> {
    const query: any = {
      recruiterId: new Types.ObjectId(recruiterId),
      deleted: { $ne: true },
    };

    if (search && String(search).trim().length > 0) {
      const buildViRegex = (raw: string) => {
        const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const map: Record<string, string> = {
          a: 'aàáạảãâầấậẩẫăằắặẳẵ',
          e: 'eèéẹẻẽêềếệểễ',
          i: 'iìíịỉĩ',
          o: 'oòóọỏõôồốộổỗơờớợởỡ',
          u: 'uùúụủũưừứựửữ',
          y: 'yỳýỵỷỹ',
          d: 'dđ',
        };
        const toClass = (ch: string) => {
          const lower = ch.toLowerCase();
          if (map[lower]) {
            const cls = map[lower];
            const full = cls + cls.toUpperCase();
            return `[${full}]`;
          }
          if (/[\s_-]/.test(ch)) return '.*';
          return escapeRegExp(ch);
        };
        const pattern = Array.from(raw).map(toClass).join('');
        return new RegExp(pattern, 'i');
      };
      const viRe = buildViRegex(String(search).trim());
      const regex = { $regex: viRe } as any;
      let companyIds: Types.ObjectId[] = [] as any;
      try {
        const matchedCompanies = await this.companyModel.find({ name: regex as any }).select('_id');
        companyIds = matchedCompanies.map((c: any) => new Types.ObjectId(String(c._id)));
      } catch {}
      query.$or = [
        { title: regex },
        { description: regex },
        { requirements: regex },
        { benefits: regex },
        { skills: regex },
        { location: regex },
        { levelVi: regex },
        { levelEn: regex },
        { education: regex },
        ...(companyIds.length ? [{ companyId: { $in: companyIds } }] : []),
      ];
    }

    if (location && String(location).trim().length > 0) {
      query.location = { $regex: String(location).trim(), $options: 'i' };
    }

    if (categories && (Array.isArray(categories) || String(categories).trim().length > 0)) {
      const cats = Array.isArray(categories)
        ? categories
        : String(categories).split(',').map((s) => s.trim()).filter(Boolean);
      if (cats.length) {
        const or = cats.map((c) => ({ title: { $regex: new RegExp(c, 'i') } }));
        const list = await this.jobCategoriesModel.find({ $or: or }).select('_id');
        const ids = list.map((d: any) => new Types.ObjectId(String(d._id)));
        if (ids.length) query.jobCategoryId = { $in: ids };
      }
    }

    if (level && String(level).trim()) {
      const re = new RegExp(String(level).trim(), 'i');
      query.$and = [...(query.$and || []), { $or: [{ levelVi: re }, { levelEn: re }] }];
    }

    if (experience && String(experience).trim()) {
      const re = new RegExp(String(experience).trim(), 'i');
      query.$and = [...(query.$and || []), { $or: [{ requirements: re }, { description: re }] }];
    }

    if (typeof salaryMin === 'number' || typeof salaryMax === 'number') {
      const min = typeof salaryMin === 'number' ? salaryMin : 0;
      const max = typeof salaryMax === 'number' ? salaryMax : Number.MAX_SAFE_INTEGER;
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { isSalaryNegotiable: true },
            { $and: [ { salaryMin: { $lte: max } }, { salaryMax: { $gte: min } } ] },
          ],
        },
      ];
    }

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

      // Tạo job mới với recruiterId (đúng _id của recruiter), companyId và slug
      const newJob = new this.jobsModel({
        ...createJobDto,
        recruiterId: recruiter.accountId,
        companyId: recruiter.companyId,
        slug,
        // Security: recruiters cannot self-enable featured without payment
        isFeatured: false,
        featuredPackageId: undefined,
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