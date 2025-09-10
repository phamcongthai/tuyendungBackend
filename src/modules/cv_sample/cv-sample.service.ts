import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CvSampleRepository } from './repositories/cv-sample.repository';
import { CvSample } from './schemas/cv-sample.schema';

@Injectable()
export class CvSampleService {
  constructor(
    private readonly cvSampleRepository: CvSampleRepository,
  ) {}

  async create(createData: {
    html: string;
    css: string;
    name: string;
    title: string;
    description?: string;
    demoImage?: string;
  }): Promise<CvSample> {
    if (!createData.html || !createData.css || !createData.name || !createData.title) {
      throw new BadRequestException('HTML, CSS, tên và tiêu đề CV mẫu là bắt buộc');
    }

    return this.cvSampleRepository.create(createData);
  }

  async findAll(page?: number, limit?: number, isActive?: boolean) {
    return this.cvSampleRepository.findAll(page, limit, isActive);
  }

  async findById(id: string): Promise<CvSample> {
    if (!id) {
      throw new BadRequestException('ID là bắt buộc');
    }

    const cvSample = await this.cvSampleRepository.findById(id);
    if (!cvSample) {
      throw new NotFoundException('Không tìm thấy CV mẫu');
    }

    return cvSample;
  }

  async update(id: string, updateData: {
    html?: string;
    css?: string;
    name?: string;
    title?: string;
    description?: string;
    demoImage?: string;
    isActive?: boolean;
  }): Promise<CvSample> {
    if (!id) {
      throw new BadRequestException('ID là bắt buộc');
    }

    const cvSample = await this.cvSampleRepository.update(id, updateData);
    if (!cvSample) {
      throw new NotFoundException('Không tìm thấy CV mẫu để cập nhật');
    }

    return cvSample;
  }

  async delete(id: string): Promise<{ message: string }> {
    if (!id) {
      throw new BadRequestException('ID là bắt buộc');
    }

    const success = await this.cvSampleRepository.delete(id);
    if (!success) {
      throw new NotFoundException('Không tìm thấy CV mẫu để xóa');
    }

    return { message: 'Xóa CV mẫu thành công' };
  }

  async hardDelete(id: string): Promise<{ message: string }> {
    if (!id) {
      throw new BadRequestException('ID là bắt buộc');
    }

    const success = await this.cvSampleRepository.hardDelete(id);
    if (!success) {
      throw new NotFoundException('Không tìm thấy CV mẫu để xóa vĩnh viễn');
    }

    return { message: 'Xóa vĩnh viễn CV mẫu thành công' };
  }

  async findActive(): Promise<CvSample[]> {
    return this.cvSampleRepository.findActive();
  }

  async toggleActive(id: string): Promise<CvSample> {
    if (!id) {
      throw new BadRequestException('ID là bắt buộc');
    }

    const cvSample = await this.cvSampleRepository.findById(id);
    if (!cvSample) {
      throw new NotFoundException('Không tìm thấy CV mẫu');
    }

    const updatedCvSample = await this.cvSampleRepository.update(id, { isActive: !cvSample.isActive });
    if (!updatedCvSample) {
      throw new NotFoundException('Không thể cập nhật CV mẫu');
    }

    return updatedCvSample;
  }
}
