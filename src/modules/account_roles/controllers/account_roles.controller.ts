import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { Types } from 'mongoose';
import { AccountRolesService } from '../account_roles.service';
import { CreateAccountRoleDto } from '../dtos/create.dto';
import { UpdateAccountRoleDto } from '../dtos/update.dto';
import { AccountRole } from '../schemas/account_role.schema';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Account Roles')
@Controller('admin/account-roles')
export class AccountRolesController {
  constructor(private readonly service: AccountRolesService) {}

  @ApiOperation({ 
    summary: 'Get all account-role relationships',
    description: 'Retrieves a list of all account-role relationships'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Account roles retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          accountId: { type: 'string' },
          roleId: { type: 'string' },
          assignedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string' }
        }
      }
    }
  })
  @Get()
  async findAll(): Promise<any[]> {
    const list = await this.service.findAll();
    return list.map((doc) => this.toResponse(doc));
  }

  @ApiOperation({ 
    summary: 'Get account-role relationships by account ID',
    description: 'Retrieves all roles assigned to a specific account'
  })
  @ApiParam({ name: 'accountId', type: String, description: 'Account ID (MongoDB ObjectId)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Account roles retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          accountId: { type: 'string' },
          roleId: { type: 'string' },
          assignedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string' }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid account ID format' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Get(':accountId')
  async findByAccount(
    @Param('accountId', ParseObjectIdPipe) accountId: Types.ObjectId,
  ): Promise<any[]> {
    const list = await this.service.findByAccount(accountId);
    return list.map((doc) => this.toResponse(doc));
  }

  @ApiOperation({ 
    summary: 'Get specific account-role relationship',
    description: 'Retrieves a specific account-role relationship by account ID and role ID'
  })
  @ApiParam({ name: 'accountId', type: String, description: 'Account ID (MongoDB ObjectId)' })
  @ApiParam({ name: 'roleId', type: String, description: 'Role ID (MongoDB ObjectId)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Account role relationship retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        accountId: { type: 'string' },
        roleId: { type: 'string' },
        assignedAt: { type: 'string', format: 'date-time' },
        status: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Account-role relationship not found' })
  @Get(':accountId/:roleId')
  async findOne(
    @Param('accountId', ParseObjectIdPipe) accountId: Types.ObjectId,
    @Param('roleId', ParseObjectIdPipe) roleId: Types.ObjectId,
  ): Promise<any> {
    const doc = await this.service.findOne(accountId, roleId);
    return this.toResponse(doc);
  }

  @ApiOperation({ 
    summary: 'Create account-role relationship',
    description: 'Assigns a role to an account by creating a new account-role relationship'
  })
  @ApiBody({ type: CreateAccountRoleDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Account role relationship created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        accountId: { type: 'string' },
        roleId: { type: 'string' },
        assignedAt: { type: 'string', format: 'date-time' },
        status: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid data or account/role not found' })
  @ApiResponse({ status: 409, description: 'Account-role relationship already exists' })
  @Post('create')
  async create(@Body(new ParseObjectIdPipe()) dto: CreateAccountRoleDto): Promise<any> {
    console.log(dto);
    
    const created = await this.service.create(dto);
    return this.toResponse(created);
  }

  @ApiOperation({ 
    summary: 'Update account-role relationship',
    description: 'Updates an existing account-role relationship'
  })
  @ApiParam({ name: 'accountId', type: String, description: 'Account ID (MongoDB ObjectId)' })
  @ApiParam({ name: 'roleId', type: String, description: 'Role ID (MongoDB ObjectId)' })
  @ApiBody({ type: UpdateAccountRoleDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Account role relationship updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        accountId: { type: 'string' },
        roleId: { type: 'string' },
        assignedAt: { type: 'string', format: 'date-time' },
        status: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 404, description: 'Account-role relationship not found' })
  @Patch(':accountId/:roleId')
  async update(
    @Param('accountId', ParseObjectIdPipe) accountId: Types.ObjectId,
    @Param('roleId', ParseObjectIdPipe) roleId: Types.ObjectId,
    @Body(new ParseObjectIdPipe()) dto: UpdateAccountRoleDto,
  ): Promise<any> {
    const updated = await this.service.update(accountId, roleId, dto);
    return this.toResponse(updated);
  }

  @ApiOperation({ 
    summary: 'Delete specific account-role relationship',
    description: 'Removes a specific role from an account'
  })
  @ApiParam({ name: 'accountId', type: String, description: 'Account ID (MongoDB ObjectId)' })
  @ApiParam({ name: 'roleId', type: String, description: 'Role ID (MongoDB ObjectId)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Account role relationship deleted successfully',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Account-role relationship not found' })
  @Delete('deleteOne/:accountId/:roleId')
  async deleteOne(
    @Param('accountId', ParseObjectIdPipe) accountId: Types.ObjectId,
    @Param('roleId', ParseObjectIdPipe) roleId: Types.ObjectId,
  ): Promise<{ deleted: boolean }> {
    await this.service.deleteOne(accountId, roleId);
    return { deleted: true };
  }

  @ApiOperation({ 
    summary: 'Delete all roles from account',
    description: 'Removes all role assignments from a specific account'
  })
  @ApiParam({ name: 'accountId', type: String, description: 'Account ID (MongoDB ObjectId)' })
  @ApiResponse({ 
    status: 200, 
    description: 'All account roles deleted successfully',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'number', description: 'Number of deleted relationships' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @Delete('deleteMany/:accountId')
  async deleteMany(
    @Param('accountId', ParseObjectIdPipe) accountId: Types.ObjectId,
  ): Promise<{ deleted: number }> {
    const deletedCount = await this.service.deleteMany(accountId);
    return { deleted: deletedCount };
  }

  private toResponse(doc: AccountRole | null) {
    if (!doc) return null;
    return {
      ...doc.toObject(),
      _id: (doc._id as Types.ObjectId).toString(),
      accountId: doc.accountId.toString(),
      roleId: doc.roleId.toString(),
    };
  }
}
