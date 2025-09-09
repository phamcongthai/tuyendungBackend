import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesService } from '../roles.service';
import { CreateRolesDto } from '../dtos/create-role.dto';
import { UpdateRolesDto } from '../dtos/update-role.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Roles')
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly RolesService: RolesService) { }
  @ApiOperation({ 
    summary: 'Get all roles with pagination and filters',
    description: 'Retrieves a paginated list of roles with optional search and status filtering'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by role name or description' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by role status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Roles retrieved successfully',
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
              permissions: { type: 'array', items: { type: 'string' } },
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
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('status') status?: string,
  ) {
    return this.RolesService.findAll(page, limit, search, status);
  }
  @ApiOperation({ 
    summary: 'Get role by ID',
    description: 'Retrieves a specific role by its ID'
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Role retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        permissions: { type: 'array', items: { type: 'string' } },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.RolesService.findOne(id);
  }
  @ApiOperation({ 
    summary: 'Update role',
    description: 'Updates an existing role with new data'
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID to update' })
  @ApiBody({ type: UpdateRolesDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Role updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Role updated successfully' },
        role: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
            status: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRolesDto: UpdateRolesDto) {
    return this.RolesService.update(id, updateRolesDto);
  }
  @ApiOperation({ 
    summary: 'Create new role',
    description: 'Creates a new role with the provided details'
  })
  @ApiBody({ type: CreateRolesDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Role created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Role created successfully' },
        role: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
            status: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid role data' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  @Post('create')
  create(@Body() createRolesDto: CreateRolesDto) {
    return this.RolesService.create(createRolesDto);
  }
}
