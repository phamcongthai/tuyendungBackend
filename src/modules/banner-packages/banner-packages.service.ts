import { Injectable } from '@nestjs/common';
import { BannerPackagesRepository } from './repositories/banner-packages.repository';
import { BannerPackage } from './schemas/banner-package.schema';

@Injectable()
export class BannerPackagesService {
  constructor(private readonly repo: BannerPackagesRepository) {}

  create(data: Partial<BannerPackage>) { return this.repo.create(data); }
  update(id: string, data: Partial<BannerPackage>) { return this.repo.update(id, data); }
  list(filter: any, page?: number, limit?: number) { return this.repo.findAll(filter, page, limit); }
  detail(id: string) { return this.repo.findById(id); }
  remove(id: string) { return this.repo.delete(id); }
}







