import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blog, BlogDocument } from './schemas/blog.schema';
import { generateUniqueSlug } from '../../utils/slug';

@Injectable()
export class BlogsService {
  constructor(@InjectModel(Blog.name) private readonly model: Model<BlogDocument>) {}

  async create(payload: { title: string; excerpt?: string; content: string; coverImageUrl: string; tags?: string[]; published?: boolean }, accountId?: string) {
    const slug = await generateUniqueSlug(this.model, payload.title);
    const doc = await this.model.create({
      title: payload.title,
      slug,
      excerpt: payload.excerpt || '',
      content: payload.content,
      coverImageUrl: payload.coverImageUrl,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      published: Boolean(payload.published),
      publishedAt: payload.published ? new Date() : null,
      createdBy: accountId && Types.ObjectId.isValid(accountId) ? new Types.ObjectId(accountId) : null,
    });
    return doc;
  }

  async update(id: string, payload: Partial<{ title: string; excerpt: string; content: string; coverImageUrl: string; tags: string[]; published: boolean }>) {
    const update: any = {};
    if (typeof payload.title === 'string') update.title = payload.title;
    if (typeof payload.excerpt === 'string') update.excerpt = payload.excerpt;
    if (typeof payload.content === 'string') update.content = payload.content;
    if (typeof payload.coverImageUrl === 'string') update.coverImageUrl = payload.coverImageUrl;
    if (Array.isArray(payload.tags)) update.tags = payload.tags;
    if (typeof payload.published === 'boolean') {
      update.published = payload.published;
      update.publishedAt = payload.published ? new Date() : null;
    }
    if (typeof payload.title === 'string') {
      // regenerate slug if title changes
      update.slug = await generateUniqueSlug(this.model, payload.title, id);
    }
    return this.model.findByIdAndUpdate(id, { $set: update }, { new: true });
  }

  async findPublicList(query: { page?: number; limit?: number; keyword?: string; tag?: string }) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;
    const filter: any = { published: true };
    if (query.keyword) filter.$text = { $search: query.keyword };
    if (query.tag) filter.tags = query.tag;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).select('title slug excerpt coverImageUrl tags publishedAt createdAt').lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit }; 
  }

  async findBySlug(slug: string) {
    return this.model.findOne({ slug, published: true }).lean();
  }

  async findAdminList() {
    return this.model.find({}).sort({ createdAt: -1 }).lean();
  }
}


