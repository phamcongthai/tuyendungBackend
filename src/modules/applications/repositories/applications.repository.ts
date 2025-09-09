import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from '../../jobs/jobs.schema';
import { Application, ApplicationDocument } from '../schemas/application.schema';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

@Injectable()
export class ApplicationsRepository {
  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
  ) {}

  async create(accountId: string, jobId: string, note?: string, resumeUrl?: string, userId?: string): Promise<Application> {
    if (!accountId || !jobId) {
      throw new BadRequestException('accountId và jobId là bắt buộc');
    }

    // Ensure job exists to prevent saving invalid/random jobId
    const jobExists = await this.jobModel.exists({ _id: new Types.ObjectId(jobId), deleted: false });
    if (!jobExists) {
      throw new BadRequestException('Không tìm thấy công việc với jobId đã cung cấp');
    }

    const existing = await this.applicationModel.findOne({ accountId: new Types.ObjectId(accountId), jobId: new Types.ObjectId(jobId) });
    if (existing && existing.status !== 'withdrawn') {
      throw new BadRequestException('Bạn đã ứng tuyển công việc này');
    }

    const doc = new this.applicationModel({
      accountId: new Types.ObjectId(accountId),
      ...(userId ? { userId: new Types.ObjectId(userId) } : {}),
      jobId: new Types.ObjectId(jobId),
      note: note ?? null,
      status: 'pending',
      ...(resumeUrl ? { resumeUrl } : {}),
    });
    return await doc.save();
  }

  async findById(id: string) {
    return await this.applicationModel
      .findById(id)
      .populate({ path: 'userId', select: 'fullName email cvData avatar' })
      .populate({ path: 'userProfile', select: 'avatar dateOfBirth gender city desiredPosition summaryExperience skills cvData' })
      .populate({ path: 'account', select: 'fullName email phone' })
      .populate({ path: 'jobId' });
  }

  async findAllByUser(userIdOrAccountId: string, page = 1, limit = 12): Promise<{ data: Application[]; total: number }> {
    const id = new Types.ObjectId(userIdOrAccountId);
    const query = { $or: [{ userId: id }, { accountId: id }] } as any;
    const data = await this.applicationModel
      .find(query)
      .populate({ path: 'jobId' })
      .populate({ path: 'userId', select: 'fullName email cvData avatar' })
      .populate({ path: 'userProfile', select: 'avatar dateOfBirth gender city desiredPosition summaryExperience skills cvData' })
      .populate({ path: 'account', select: 'fullName email phone' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    const total = await this.applicationModel.countDocuments(query);
    return { data, total };
  }

  async findAllByJob(jobId: string, page = 1, limit = 12): Promise<{ data: Application[]; total: number }> {
    const query = { jobId: new Types.ObjectId(jobId) } as any;
    const data = await this.applicationModel
      .find(query)
      .populate({ path: 'userId', select: 'fullName email cvData avatar' })
      .populate({ path: 'userProfile', select: 'avatar dateOfBirth gender city desiredPosition summaryExperience skills cvData' })
      .populate({ path: 'account', select: 'fullName email phone' })
      .populate({ path: 'jobId' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    const total = await this.applicationModel.countDocuments(query);
    return { data, total };
  }

  async updateStatus(id: string, status: ApplicationStatus, note?: string): Promise<Application> {
    if (!['pending', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }
    const updated = await this.applicationModel.findByIdAndUpdate(
      id,
      { status, ...(note !== undefined ? { note } : {}) },
      { new: true },
    );
    if (!updated) {
      throw new BadRequestException('Không thể cập nhật ứng tuyển');
    }
    return updated;
  }

  async withdrawByUser(userId: string, id: string): Promise<Application> {
    const updated = await this.applicationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { status: 'withdrawn' },
      { new: true },
    );
    if (!updated) {
      throw new BadRequestException('Không thể hủy ứng tuyển');
    }
    return updated;
  }
}


