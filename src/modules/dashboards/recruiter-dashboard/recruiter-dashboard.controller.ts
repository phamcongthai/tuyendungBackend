import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { RecruiterDashboardService } from './recruiter-dashboard.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
export class RecruiterDashboardController {
  constructor(private readonly recruiterDashboardService: RecruiterDashboardService) {}

  @ApiOperation({ 
    summary: 'Get recruiter dashboard data',
    description: 'Retrieves dashboard statistics and data for authenticated recruiters only'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalJobs: { type: 'number', description: 'Total number of jobs posted by recruiter' },
        activeJobs: { type: 'number', description: 'Number of active jobs' },
        inactiveJobs: { type: 'number', description: 'Number of inactive jobs' },
        totalApplications: { type: 'number', description: 'Total applications received' },
        recentJobs: {
          type: 'array',
          description: 'List of recently posted jobs',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
              company: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        statistics: {
          type: 'object',
          description: 'Additional dashboard statistics'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have Recruiter role' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('recruiter')
  @Roles('Recruiter')
  async getRecruiterDashboard(@Request() req) {
    return await this.recruiterDashboardService.getDashboardData();
  }
}
