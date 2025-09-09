import { Injectable } from '@nestjs/common';
import { JobCategoriesRepository } from '../modules/job-categories/repositories/job-categories.repository';
import { JobCategoriesStatus } from '../modules/job-categories/job-categories.schema';

@Injectable()
export class JobCategoriesSeeder {
  constructor(
    private jobCategoriesRepository: JobCategoriesRepository,
  ) {}

  async seed() {
    const categories = [
      {
        title: 'Công nghệ thông tin',
        description: 'Các vị trí liên quan đến lập trình, phát triển phần mềm, IT',
        status: JobCategoriesStatus.ACTIVE,
      },
      {
        title: 'Marketing & Truyền thông',
        description: 'Các vị trí marketing, quảng cáo, truyền thông',
        status: JobCategoriesStatus.ACTIVE,
      },
      {
        title: 'Tài chính & Kế toán',
        description: 'Các vị trí tài chính, kế toán, ngân hàng',
        status: JobCategoriesStatus.ACTIVE,
      },
      {
        title: 'Nhân sự',
        description: 'Các vị trí quản lý nhân sự, tuyển dụng',
        status: JobCategoriesStatus.ACTIVE,
      },
      {
        title: 'Kinh doanh & Bán hàng',
        description: 'Các vị trí kinh doanh, bán hàng, chăm sóc khách hàng',
        status: JobCategoriesStatus.ACTIVE,
      },
      {
        title: 'Thiết kế & Sáng tạo',
        description: 'Các vị trí thiết kế đồ họa, UI/UX, sáng tạo nội dung',
        status: JobCategoriesStatus.ACTIVE,
      },
      {
        title: 'Vận hành & Sản xuất',
        description: 'Các vị trí vận hành, sản xuất, logistics',
        status: JobCategoriesStatus.ACTIVE,
      },
      {
        title: 'Giáo dục & Đào tạo',
        description: 'Các vị trí giảng dạy, đào tạo, giáo dục',
        status: JobCategoriesStatus.ACTIVE,
      },
      {
        title: 'Y tế & Chăm sóc sức khỏe',
        description: 'Các vị trí y tế, chăm sóc sức khỏe, dược phẩm',
        status: JobCategoriesStatus.ACTIVE,
      },
      {
        title: 'Luật & Pháp lý',
        description: 'Các vị trí luật sư, tư vấn pháp lý',
        status: JobCategoriesStatus.ACTIVE,
      },
    ];

    for (const category of categories) {
      // Check if category with same title already exists
      const existingCategories = await this.jobCategoriesRepository.findAll(1, 1000, category.title);
      const existingCategory = existingCategories.data.find(cat => cat.title === category.title);
      
      if (!existingCategory) {
        await this.jobCategoriesRepository.create(category);
        console.log(`Created job category: ${category.title}`);
      } else {
        console.log(`Job category already exists: ${category.title}`);
      }
    }

    console.log('Job categories seeding completed!');
  }
}
