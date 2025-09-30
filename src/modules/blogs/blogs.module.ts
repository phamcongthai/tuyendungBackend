import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './schemas/blog.schema';
import { BlogsService } from './blogs.service';
import { AdminBlogsController } from './controllers/admin.blogs.controller';
import { PublicBlogsController } from './controllers/public.blogs.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ],
  controllers: [AdminBlogsController, PublicBlogsController],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}


