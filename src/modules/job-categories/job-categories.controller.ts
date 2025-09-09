import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import { JobCategoriesService } from './job-categories.service';
import { CreateJobCategoryDto } from './dto/create-job-categories.dto';
import { UpdateJobCategoryDto } from './dto/update-job-categories.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Job Categories')
@Controller('admin/job-categories')
export class JobCategoriesController {
  constructor(private readonly jobsService: JobCategoriesService) {}

  @ApiOperation({ 
    summary: 'Get all job categories with pagination and filters',
    description: 'Retrieves a paginated list of job categories with optional search and status filtering'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by category name or description' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by category status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job categories retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              slug: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            totalPages: { type: 'number' },
            totalItems: { type: 'number' },
            limit: { type: 'number' }
          }
        }
      }
    }
  })
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status?: string,
  ) {
    return this.jobsService.findAll(Number(page), Number(limit), search, status);
  }

  @ApiOperation({ 
    summary: 'Create new job category',
    description: 'Creates a new job category with the provided details'
  })
  @ApiBody({ type: CreateJobCategoryDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Job category created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Job category created successfully' },
        category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            slug: { type: 'string' },
            status: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid category data' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  @Post()
  async create(
    @Body() createJobDto: CreateJobCategoryDto,
  ) {
    return this.jobsService.create(createJobDto);
  }

  @ApiOperation({ 
    summary: 'Update job category',
    description: 'Updates an existing job category with new data'
  })
  @ApiParam({ name: 'id', type: String, description: 'Job category ID to update' })
  @ApiBody({ type: UpdateJobCategoryDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Job category updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Job category updated successfully' },
        category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            slug: { type: 'string' },
            status: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 404, description: 'Job category not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobCategoryDto,
  ) {
    return this.jobsService.update(id, updateJobDto);
  }

  @ApiOperation({ 
    summary: 'Get job category details',
    description: 'Retrieves detailed information about a specific job category'
  })
  @ApiParam({ name: 'id', type: String, description: 'Job category ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job category details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        slug: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Job category not found' })
  @Get('detail/:id')
  async detail(@Param('id') id: string) {
    return this.jobsService.detail(id);
  }

  @ApiOperation({ 
    summary: 'Delete job category (soft delete)',
    description: 'Soft deletes a job category by changing its status'
  })
  @ApiParam({ name: 'id', type: String, description: 'Job category ID to delete' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job category deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Job category deleted successfully' },
        deleted: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Job category not found' })
  @Patch('delete/:id')
  async delete(@Param('id') id: string) {
    return this.jobsService.delete(id);
  }

  @ApiOperation({ 
    summary: 'Toggle job category status',
    description: 'Toggles job category status between active and inactive'
  })
  @ApiParam({ name: 'id', type: String, description: 'Job category ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job category status toggled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Status updated successfully' },
        category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Job category not found' })
  @Patch('toggle-status/:id')
  async toggleStatus(@Param('id') id: string) {
    return this.jobsService.toggleStatus(id);
  }
}
