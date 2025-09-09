import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  BadRequestException,
  Patch,
  Delete,
} from '@nestjs/common';
import { AccountsService } from '../accounts.service';
import { CreateAccountsDto } from '../dtos/CreateAccountsDto.dto';
import { UpdateAccountsDto } from '../dtos/UpdateAccounts.Dto.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Accounts')
@Controller('admin/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @ApiOperation({ 
    summary: 'Get all accounts with pagination and filters',
    description: 'Retrieves a paginated list of accounts with optional search and status filtering'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by email or name' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by account status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Accounts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              email: { type: 'string' },
              status: { type: 'string' },
              isVerified: { type: 'boolean' },
              lastLoginAt: { type: 'string', format: 'date-time' },
              roles: { type: 'array', items: { type: 'object' } }
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
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('status') status?: string,
  ) {
    return this.accountsService.findAll(page, limit, search, status);
  }

  @ApiOperation({ 
    summary: 'Get account by ID with roles',
    description: 'Retrieves a specific account by ID including associated roles'
  })
  @ApiParam({ name: 'id', type: String, description: 'Account ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Account retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        email: { type: 'string' },
        status: { type: 'string' },
        isVerified: { type: 'boolean' },
        lastLoginAt: { type: 'string', format: 'date-time' },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              permissions: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Account không tồn tại' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Get(':id/roles')
  async findOne(@Param('id') id: string) {
    const account = await this.accountsService.findOne(id);
    if (!account) {
      throw new BadRequestException('Account không tồn tại');
    }
    return account;
  }

  @ApiOperation({ 
    summary: 'Create new account',
    description: 'Creates a new account with the provided details'
  })
  @ApiBody({ type: CreateAccountsDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Account created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Account created successfully' },
        account: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string' },
            status: { type: 'string' },
            isVerified: { type: 'boolean' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid account data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Post('create')
  async create(@Body() createAccountsDto: CreateAccountsDto) {
    return this.accountsService.create(createAccountsDto);
  }

  @ApiOperation({ 
    summary: 'Update account',
    description: 'Updates an existing account with the provided data'
  })
  @ApiParam({ name: 'id', type: String, description: 'Account ID to update' })
  @ApiBody({ type: UpdateAccountsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Account updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Account updated successfully' },
        account: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string' },
            status: { type: 'string' },
            isVerified: { type: 'boolean' },
            lastLoginAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAccountsDto: UpdateAccountsDto,
  ) {
    return this.accountsService.update(id, updateAccountsDto);
  }

  @ApiOperation({ 
    summary: 'Delete account (soft delete)',
    description: 'Soft deletes an account by setting its status to inactive'
  })
  @ApiParam({ name: 'id', type: String, description: 'Account ID to delete' })
  @ApiResponse({ 
    status: 200, 
    description: 'Account deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Account deleted successfully' },
        deleted: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }
}
