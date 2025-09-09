import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
  Param,
  Patch
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JobsService } from '../jobs.service';
import { CreateJobDto } from '../dto/request/create-job.dto';
import { UpdateJobDto } from '../dto/request/update-job.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Jobs - Admin')
@Controller('admin/jobs')
export class AdminJobsController {
  constructor(private readonly jobsService: JobsService) {}
  
  @ApiOperation({ 
    summary: 'Get all jobs for admin with pagination and filters',
    description: 'Retrieves a paginated list of jobs with optional search and status filtering for admin panel'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by job title' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by job status (active, inactive)' })
  @ApiQuery({ name: 'jobType', required: false, type: String, description: 'Filter by job type (fulltime, parttime, internship, contract, freelance)' })
  @ApiQuery({ name: 'workingMode', required: false, type: String, description: 'Filter by working mode (onsite, remote, hybrid)' })
  @ApiQuery({ name: 'jobCategoryId', required: false, type: String, description: 'Filter by job category ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Jobs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              jobType: { type: 'string' },
              workingMode: { type: 'string' },
              location: { type: 'string' },
              salaryMin: { type: 'number' },
              salaryMax: { type: 'number' },
              currency: { type: 'string' },
              isActive: { type: 'boolean' },
              deadline: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              recruiter: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  fullName: { type: 'string' },
                  email: { type: 'string' }
                }
              },
              company: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' }
                }
              },
              jobCategory: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  title: { type: 'string' }
                }
              }
            }
          }
        },
        total: { type: 'number' }
      }
    }
  })
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status?: string,
    @Query('jobType') jobType?: string,
    @Query('workingMode') workingMode?: string,
    @Query('jobCategoryId') jobCategoryId?: string,
  ) {
    return this.jobsService.findAll(
      Number(page), 
      Number(limit), 
      search, 
      status,
      jobType,
      workingMode,
      jobCategoryId
    );
  }

  @ApiOperation({ 
    summary: 'Create new job',
    description: 'Creates a new job posting with optional file uploads'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ 
    type: CreateJobDto,
    description: 'Job creation data with optional files'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Job created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Job created successfully' },
        job: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            jobType: { type: 'string' },
            workingMode: { type: 'string' },
            location: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid job data' })
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Body() createJobDto: CreateJobDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.jobsService.create(createJobDto, files);
  }

  @ApiOperation({ 
    summary: 'Update job',
    description: 'Updates an existing job posting'
  })
  @ApiParam({ name: 'id', type: String, description: 'Job ID to update' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ 
    type: UpdateJobDto,
    description: 'Job update data with optional files'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Job updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Job updated successfully' },
        job: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            jobType: { type: 'string' },
            workingMode: { type: 'string' },
            location: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid job data' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  async update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.jobsService.update(id, updateJobDto, files);
  }

  @ApiOperation({ 
    summary: 'Get job details',
    description: 'Retrieves detailed information about a specific job'
  })
  @ApiParam({ name: 'id', type: String, description: 'Job ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        requirements: { type: 'string' },
        benefits: { type: 'string' },
        skills: { type: 'array', items: { type: 'string' } },
        jobType: { type: 'string' },
        workingMode: { type: 'string' },
        location: { type: 'string' },
        salaryMin: { type: 'number' },
        salaryMax: { type: 'number' },
        currency: { type: 'string' },
        deadline: { type: 'string', format: 'date-time' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        recruiter: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string' }
          }
        },
        company: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' }
          }
        },
        jobCategory: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.jobsService.detail(id);
  }

  @ApiOperation({ 
    summary: 'Delete job (soft delete)',
    description: 'Soft deletes a job by setting deleted flag to true'
  })
  @ApiParam({ name: 'id', type: String, description: 'Job ID to delete' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Job deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @Patch('delete/:id')
  async delete(@Param('id') id: string) {
    return this.jobsService.delete(id);
  }

  @ApiOperation({ 
    summary: 'Toggle job status',
    description: 'Toggles job status between ACTIVE and INACTIVE'
  })
  @ApiParam({ name: 'id', type: String, description: 'Job ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job status updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Job status updated successfully' },
        job: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @Patch('toggle-status/:id')
  async toggleStatus(@Param('id') id: string) {
    return this.jobsService.toggleStatus(id);
  }
}
