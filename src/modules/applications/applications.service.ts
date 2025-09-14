import { BadRequestException, Injectable } from '@nestjs/common';
import { ApplicationsRepository, ApplicationStatus } from './repositories/applications.repository';
import { NotificationsGateway } from '../notifications/notifications.getway';
import { JobsService } from '../jobs/jobs.service';
import { Types } from 'mongoose';
import { ApplicationDocument } from './schemas/application.schema';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly repo: ApplicationsRepository,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly jobsService: JobsService,
  ) {}

  async createFromAccount(accountId: string, jobId: string, coverLetter?: string): Promise<ApplicationDocument> {
    if (!jobId || !Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('jobId không hợp lệ');
    }
    if (!accountId || !Types.ObjectId.isValid(accountId)) {
      throw new BadRequestException('accountId không hợp lệ');
    }
    
    // Tạo application
    const application = await this.repo.create(accountId, jobId, coverLetter);
    
    // Gửi thông báo đến recruiter
    try {
      console.log('🔔 Bắt đầu gửi thông báo cho recruiter...');
      console.log('🔍 JobId để tìm:', jobId);
      
      // Lấy thông tin job để lấy recruiterId
      const job = await this.jobsService.detail(jobId);
      console.log('📋 Job details full:', JSON.stringify(job, null, 2));
      
      if (!job) {
        console.log('❌ Job not found with id:', jobId);
        // Vẫn tạo notification với thông tin cơ bản
        await this.notificationsGateway.sendNotificationToUser(
          'unknown', // Fallback recruiterId
          {
            message: `Có ứng viên mới ứng tuyển cho công việc (Job ID: ${jobId})`,
            type: 'application_submitted'
          }
        );
        console.log('✅ Đã gửi thông báo fallback');
        return application;
      }
      
      console.log('✅ Job found:', job.title);
      
      // Lấy recruiterId từ job
      let recruiterId: string | null = null;
      if (job.recruiterId) {
        // Nếu recruiterId là object (đã populate), lấy _id
        if (typeof job.recruiterId === 'object' && job.recruiterId._id) {
          recruiterId = job.recruiterId._id.toString();
        } else {
          // Nếu recruiterId là string hoặc ObjectId
          recruiterId = job.recruiterId.toString();
        }
      }
      
      console.log('👤 RecruiterId extracted:', recruiterId);
      
      if (recruiterId && recruiterId !== 'unknown') {
        console.log('✅ Sending notification to recruiter:', recruiterId);
        
        // Lấy thông tin ứng viên từ accountId
        // TODO: Cần lấy thông tin ứng viên từ Account service
        const applicantName = 'Ứng viên'; // Tạm thời
        
        // Sử dụng method mới để gửi notification
        await this.notificationsGateway.sendApplicationNotification(
          recruiterId,
          (application._id as Types.ObjectId).toString(),
          jobId,
          accountId,
          job.title,
          applicantName
        );
        
        console.log('✅ Đã gửi thông báo thành công');
      } else {
        console.log('⚠️ RecruiterId not found, sending fallback notification');
        
        // Gửi thông báo fallback
        await this.notificationsGateway.sendNotificationToUser(
          'unknown',
          {
            message: `Có ứng viên mới ứng tuyển cho công việc "${job.title || 'Unknown Job'}"`,
            type: 'application_submitted'
          }
        );
        
        console.log('✅ Đã gửi thông báo fallback');
      }
      
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Vẫn cố gắng gửi thông báo fallback
      try {
        await this.notificationsGateway.sendNotificationToUser(
          'unknown',
          {
            message: `Có ứng viên mới ứng tuyển cho công việc (Job ID: ${jobId})`,
            type: 'application_submitted'
          }
        );
        console.log('✅ Đã gửi thông báo fallback sau lỗi');
      } catch (fallbackError) {
        console.error('❌ Error sending fallback notification:', fallbackError);
      }
    }
    
    return application;
  }

  async checkApplication(accountId: string, jobId: string) {
    if (!jobId || !Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('jobId không hợp lệ');
    }
    if (!accountId || !Types.ObjectId.isValid(accountId)) {
      throw new BadRequestException('accountId không hợp lệ');
    }
    return this.repo.checkApplication(accountId, jobId);
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

  withdrawByUser(accountId: string, id: string) {
    return this.repo.withdrawByUser(accountId, id);
  }
}


