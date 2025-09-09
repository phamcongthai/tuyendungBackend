import { Injectable } from '@nestjs/common';

@Injectable()
export class RecruiterDashboardService {
  async getDashboardData() {
    return {
      message: 'Đã gọi thành công api !',
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  }
}
