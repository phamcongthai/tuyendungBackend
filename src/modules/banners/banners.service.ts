import { Injectable } from '@nestjs/common';
import { BannersRepository } from './repositories/banners.repository';
import { Banner } from './schemas/banner.schema';

@Injectable()
export class BannersService {
  constructor(private readonly repo: BannersRepository) {}

  create(data: Partial<Banner>) {
    return this.repo.create(data);
  }

  update(id: string, data: Partial<Banner>) {
    return this.repo.update(id, data);
  }

  list(filter: any, page?: number, limit?: number) {
    return this.repo.findAll(filter, page, limit);
  }

  detail(id: string) {
    return this.repo.findById(id);
  }

  remove(id: string) {
    return this.repo.delete(id);
  }

  activeByPosition(position: string) {
    return this.repo.findActiveByPosition(position);
  }
}








