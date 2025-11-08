import { Injectable } from '@nestjs/common';
import { JobPackagesRepository } from './repositories/job-packages.repository';
import { JobPackage } from './schemas/job-package.schema';

@Injectable()
export class JobPackagesService {
  constructor(private readonly repo: JobPackagesRepository) {}

  create(data: Partial<JobPackage>) {
    return this.repo.create(data);
  }

  update(id: string, data: Partial<JobPackage>) {
    return this.repo.update(id, data);
  }

  findAll(filter: any, page?: number, limit?: number) {
    return this.repo.findAll(filter, page, limit);
  }

  findById(id: string) {
    return this.repo.findById(id);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}








