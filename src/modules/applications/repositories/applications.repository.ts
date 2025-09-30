import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from '../../jobs/jobs.schema';
import { Application, ApplicationDocument } from '../schemas/application.schema';

export type ApplicationStatus = 'pending' | 'viewed' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn' | 'interviewed' | 'interview_failed';

@Injectable()
export class ApplicationsRepository {
  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
  ) {}

  async create(accountId: string, jobId: string, coverLetter?: string): Promise<ApplicationDocument> {
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
      jobId: new Types.ObjectId(jobId),
      coverLetter: coverLetter ?? null,
      status: 'pending',
    });
    return await doc.save();
  }

  async checkApplication(accountId: string, jobId: string): Promise<boolean> {
    if (!accountId || !jobId) {
      return false;
    }

    const existing = await this.applicationModel.findOne({ 
      accountId: new Types.ObjectId(accountId), 
      jobId: new Types.ObjectId(jobId),
      status: { $ne: 'withdrawn' } // Không tính các đơn đã rút
    });
    
    return !!existing;
  }

  async findById(id: string) {
    return await this.applicationModel
      .findById(id)
      .populate({ path: 'userProfile', select: 'avatar dateOfBirth gender city desiredPosition summaryExperience skills cvId cvFields' })
      .populate({ path: 'account', select: 'fullName email phone' })
      .populate({ path: 'jobId', select: '_id title slug' });
  }

  async findAllByUser(userIdOrAccountId: string, page = 1, limit = 12): Promise<{ data: Application[]; total: number }> {
    const id = new Types.ObjectId(userIdOrAccountId);
    const query = { accountId: id } as any;
    const data = await this.applicationModel
      .find(query)
      .populate({ path: 'jobId', select: '_id title slug' })
      .populate({ path: 'userProfile', select: 'avatar dateOfBirth gender city desiredPosition summaryExperience skills cvId cvFields' })
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
      .populate({ path: 'userProfile', select: 'avatar dateOfBirth gender city desiredPosition summaryExperience skills cvId cvFields' })
      .populate({ path: 'account', select: 'fullName email phone' })
      .populate({ path: 'jobId', select: '_id title slug' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    const total = await this.applicationModel.countDocuments(query);
    return { data, total };
  }

  async updateStatus(id: string, status: ApplicationStatus, note?: string): Promise<Application> {
    if (!['pending', 'viewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn', 'interviewed', 'interview_failed'].includes(status)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }
    // Enforce allowed transitions
    const current = await this.applicationModel.findById(id).select('status');
    if (!current) {
      throw new BadRequestException('Không tìm thấy ứng tuyển');
    }
    const currentStatus = String(current.status).toLowerCase();
    const nextStatus = String(status).toLowerCase();
    const statusTransitions: Record<string, string[]> = {
      pending: ['viewed', 'rejected', 'withdrawn'],
      viewed: ['shortlisted', 'rejected', 'withdrawn'],
      shortlisted: ['interviewed', 'rejected', 'withdrawn'],
      interviewed: ['accepted', 'interview_failed', 'withdrawn'],
      interview_failed: ['rejected'],
      accepted: [],
      rejected: [],
      withdrawn: [],
    };
    const allowedNext = statusTransitions[currentStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
      throw new BadRequestException(`Không thể chuyển trạng thái từ ${currentStatus} sang ${nextStatus}`);
    }
    const updated = await this.applicationModel.findByIdAndUpdate(
      id,
      { status: nextStatus, ...(note !== undefined ? { note } : {}) },
      { new: true },
    );
    if (!updated) {
      throw new BadRequestException('Không thể cập nhật ứng tuyển');
    }
    return updated;
  }

  async updateInterested(id: string, interested: boolean): Promise<Application> {
    const updated = await this.applicationModel.findByIdAndUpdate(
      id,
      { interested: Boolean(interested) },
      { new: true },
    );
    if (!updated) {
      throw new BadRequestException('Không thể cập nhật quan tâm');
    }
    return updated;
  }

  async updateInterviewInfo(
    id: string,
    data: { interviewDate?: Date | null; interviewLocation?: string | null; interviewNote?: string | null }
  ): Promise<Application> {
    const toSet: any = {};
    if (data.interviewDate !== undefined) toSet.interviewDate = data.interviewDate;
    if (data.interviewLocation !== undefined) toSet.interviewLocation = data.interviewLocation;
    if (data.interviewNote !== undefined) toSet.interviewNote = data.interviewNote;

    const updated = await this.applicationModel.findByIdAndUpdate(
      id,
      toSet,
      { new: true },
    );
    if (!updated) {
      throw new BadRequestException('Không thể cập nhật thông tin phỏng vấn');
    }
    return updated;
  }

  async withdrawByUser(accountId: string, id: string): Promise<Application> {
    const updated = await this.applicationModel.findOneAndUpdate(
      { _id: id, accountId: new Types.ObjectId(accountId) },
      { status: 'withdrawn' },
      { new: true },
    );
    if (!updated) {
      throw new BadRequestException('Không thể hủy ứng tuyển');
    }
    return updated;
  }
}


