import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlogsService } from '../blogs.service';

@ApiTags('Blogs - Public')
@Controller('blogs')
export class PublicBlogsController {
  constructor(private readonly service: BlogsService) {}

  @Get()
  @ApiOperation({ summary: 'Public blog list' })
  async list(@Query() query: { page?: number; limit?: number; keyword?: string; tag?: string }) {
    return this.service.findPublicList(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get blog by slug' })
  async get(@Param('slug') slug: string) {
    const doc = await this.service.findBySlug(slug);
    return doc;
  }
}


