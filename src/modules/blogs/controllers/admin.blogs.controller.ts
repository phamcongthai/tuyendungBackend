import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlogsService } from '../blogs.service';

@ApiTags('Blogs - Admin')
@Controller('admin/blogs')
export class AdminBlogsController {
  constructor(private readonly service: BlogsService) {}

  @Get()
  @ApiOperation({ summary: 'List all blogs (admin)' })
  async list() {
    return this.service.findAdminList();
  }

  @Post()
  @ApiOperation({ summary: 'Create a blog' })
  async create(@Req() req: any, @Body() body: { title: string; excerpt?: string; content: string; coverImageUrl: string; tags?: string[]; published?: boolean }) {
    const accountId = req.user?.id as string | undefined;
    const doc = await this.service.create(body, accountId);
    return { message: 'Created', data: doc };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a blog' })
  async update(@Param('id') id: string, @Body() body: Partial<{ title: string; excerpt: string; content: string; coverImageUrl: string; tags: string[]; published: boolean }>) {
    const doc = await this.service.update(id, body);
    return { message: 'Updated', data: doc };
  }
}


