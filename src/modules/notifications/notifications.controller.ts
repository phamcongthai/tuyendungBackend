import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/CreateNotificationDto.dto';
import { UpdateNotificationDto } from './dto/UpdateNotification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Tạo mới thông báo
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  // Lấy tất cả thông báo (hoặc theo userId nếu có query)
  @Get()
  async findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.notificationsService.findByUser(userId);
    }
    return this.notificationsService.findAll();
  }

  // Lấy 1 thông báo theo id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  // Cập nhật thông báo (ví dụ: mark as read)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  // Xoá thông báo
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
