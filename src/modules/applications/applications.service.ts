import { BadRequestException, Injectable } from '@nestjs/common';
import { ApplicationsRepository, ApplicationStatus } from './repositories/applications.repository';
import { Types } from 'mongoose';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly repo: ApplicationsRepository,
  ) {}

  async createFromAccount(accountId: string, jobId: string, note?: string, resumeUrl?: string, fullName?: string) {
    if (!jobId || !Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('jobId không hợp lệ');
    }
    if (!accountId || !Types.ObjectId.isValid(accountId)) {
      throw new BadRequestException('accountId không hợp lệ');
    }
    return this.repo.create(accountId, jobId, note, resumeUrl);
  }

  findById(id: string) {
    return this.repo.findById(id);
  }

  findAllByUser(userId: string, page?: number, limit?: number) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('userId không hợp lệ');
    }
    return this.repo.findAllByUser(userId, page, limit);
  }

  findAllByJob(jobId: string, page?: number, limit?: number) {
    if (!jobId || !Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('jobId không hợp lệ');
    }
    return this.repo.findAllByJob(jobId, page, limit);
  }

  updateStatus(id: string, status: ApplicationStatus, note?: string) {
    return this.repo.updateStatus(id, status, note);
  }

  withdrawByUser(userId: string, id: string) {
    return this.repo.withdrawByUser(userId, id);
  }
}


