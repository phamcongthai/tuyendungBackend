import {
  Controller,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { JobCategoriesService } from './job-categories.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from '../jobs/jobs.schema';
import { JobCategories, JobCategoriesDocument } from './job-categories.schema';

@ApiTags('Public Job Categories')
@Controller('job-categories')
export class PublicJobCategoriesController {
  constructor(
    private readonly jobsService: JobCategoriesService,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel(JobCategories.name) private readonly categoryModel: Model<JobCategoriesDocument>,
  ) {}

  @ApiOperation({ 
    summary: 'Get all active job categories',
    description: 'Retrieves a list of active job categories for public use'
  })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by category status (default: active)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job categories retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              slug: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number' }
      }
    }
  })
  @Get()
  async findAll(@Query('status') status = 'active') {
    const result = await this.jobsService.findAll(1, 1000, '', status);

    // Aggregate active job counts per category
    const counts = await this.jobModel.aggregate([
      { $match: { deleted: false, status: 'active', jobCategoryId: { $ne: null } } },
      { $group: { _id: '$jobCategoryId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>(counts.map((c: any) => [String(c._id), c.count]));

    const data = result.data.map((cat: any) => ({
      _id: cat._id,
      title: cat.title,
      slug: cat.slug,
      description: cat.description,
      status: cat.status,
      // Assuming a 'logo' field may exist on categories; if not, leave undefined
      logo: (cat as any).logo,
      jobCount: countMap.get(String(cat._id)) || 0,
    }))
    // Only return categories that have at least 1 active job
    .filter((c: any) => c.jobCount > 0)
    // Sort by jobCount desc
    .sort((a: any, b: any) => b.jobCount - a.jobCount);

    return {
      success: true,
      message: 'Job categories retrieved successfully',
      data,
      total: result.total,
    };
  }

  @ApiOperation({ 
    summary: 'Get job category by ID',
    description: 'Retrieves a specific job category by ID'
  })
  @ApiParam({ name: 'id', type: String, description: 'Job category ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job category retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            slug: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Job category not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.jobsService.detail(id);
    return {
      success: true,
      message: 'Job category retrieved successfully',
      data: result
    };
  }
}
