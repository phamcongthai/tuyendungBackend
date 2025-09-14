import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.getway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Recruiter Notifications')
@Controller('recruiters/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Recruiter')
@ApiBearerAuth()
export class RecruiterNotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @ApiOperation({ 
    summary: 'Lấy số notification chưa đọc của recruiter',
    description: 'Trả về số lượng notification chưa đọc để hiển thị badge đỏ'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Số notification chưa đọc',
    schema: {
      type: 'object',
      properties: {
        unreadCount: { type: 'number', example: 5 }
      }
    }
  })
  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const recruiterId = req.user.id;
    const unreadCount = await this.notificationsService.countUnreadByUser(recruiterId);
    return { unreadCount };
  }

  @ApiOperation({ 
    summary: 'Lấy danh sách notification chưa đọc của recruiter',
    description: 'Trả về danh sách notification chưa đọc để hiển thị trong dropdown'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách notification chưa đọc',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string' },
          isRead: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          metadata: { type: 'object' }
        }
      }
    }
  })
  @Get('unread')
  async getUnreadNotifications(@Req() req: any) {
    const recruiterId = req.user.id;
    return this.notificationsService.findUnreadByUser(recruiterId);
  }

  @ApiOperation({ 
    summary: 'Lấy tất cả notification của recruiter và tự động đánh dấu đã đọc',
    description: 'Trả về tất cả notification và tự động đánh dấu tất cả là đã đọc khi mở danh sách'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách tất cả notification (đã được đánh dấu đã đọc)',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string' },
          isRead: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          metadata: { type: 'object' }
        }
      }
    }
  })
  @Get()
  async getAllNotifications(@Req() req: any) {
    const recruiterId = req.user.id;
    
    // Lấy tất cả notification
    const notifications = await this.notificationsService.findByUser(recruiterId);
    
    // Tự động đánh dấu tất cả notification chưa đọc là đã đọc
    await this.notificationsService.markAllAsReadByUser(recruiterId);
    
    // Gửi số notification chưa đọc mới qua Socket.IO (sẽ là 0)
    await this.notificationsGateway.sendUnreadCountToRecruiter(recruiterId);
    
    return notifications;
  }

  @ApiOperation({ 
    summary: 'Đánh dấu notification là đã đọc',
    description: 'Đánh dấu một notification cụ thể là đã đọc'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification đã được đánh dấu là đã đọc',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        isRead: { type: 'boolean' },
        readAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @Patch('mark-read/:id')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const recruiterId = req.user.id;
    
    // Kiểm tra notification có thuộc về recruiter này không
    const notification = await this.notificationsService.findOne(id);
    if (notification.userId.toString() !== recruiterId) {
      throw new Error('Unauthorized: Notification does not belong to this recruiter');
    }
    
    const updatedNotification = await this.notificationsService.markAsRead(id);
    
    // Gửi số notification chưa đọc mới qua Socket.IO
    await this.notificationsGateway.sendUnreadCountToRecruiter(recruiterId);
    
    return updatedNotification;
  }

}
