import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { JobsService } from '../jobs.service';
import { JobResponseDto } from '../dto/response/job-response.dto';
import { plainToInstance } from 'class-transformer';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('Jobs - Public')
@Controller('jobs')
export class PublicJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @ApiOperation({ 
    summary: 'Get all active jobs for public viewing',
    description: 'Retrieves a paginated list of active jobs available for public viewing with search functionality'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by job title, company, or location' })
  @ApiQuery({ name: 'jobType', required: false, type: String, description: 'Filter by job type (fulltime, parttime, internship, contract, freelance)' })
  @ApiQuery({ name: 'workingMode', required: false, type: String, description: 'Filter by working mode (onsite, remote, hybrid)' })
  @ApiQuery({ name: 'jobCategoryId', required: false, type: String, description: 'Filter by job category ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Active jobs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
              company: { type: 'string' },
              location: { type: 'string' },
              salary: { type: 'string' },
              description: { type: 'string' },
              requirements: { type: 'string' },
              images: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number', description: 'Total number of active jobs' }
      }
    }
  })
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '', // Client không được phép truyền status ở đây
    @Query('jobType') jobType?: string,
    @Query('workingMode') workingMode?: string,
    @Query('jobCategoryId') jobCategoryId?: string,
  ) {
    const status = 'active';

    // Lấy toàn bộ dữ liệu job từ service
    const {data, total} = await this.jobsService.findAll(
      Number(page),
      Number(limit),
      search,
      status,
      jobType,
      workingMode,
      jobCategoryId,
    );
    
    // Return populated companyId as is (Mongoose populate) for faster client consumption
    const processedData = data.map((job: any) => {
      const obj = typeof job.toObject === 'function' ? job.toObject() : { ...job };
      // Normalize ObjectIds to strings for stability on FE
      if (obj && obj._id && typeof obj._id !== 'string') obj._id = String(obj._id);
      if (obj && obj.recruiterId && typeof obj.recruiterId !== 'string') obj.recruiterId = String(obj.recruiterId);
      if (obj && obj.companyId && typeof obj.companyId === 'object' && obj.companyId._id && typeof obj.companyId._id !== 'string') {
        obj.companyId._id = String(obj.companyId._id);
      }
      if (obj && obj.jobCategoryId && typeof obj.jobCategoryId === 'object' && obj.jobCategoryId._id && typeof obj.jobCategoryId._id !== 'string') {
        obj.jobCategoryId._id = String(obj.jobCategoryId._id);
      }
      return obj;
    });
    
    //Bên FE nó nhận về data và total chứ không chỉ mỗi data (xem lại file apis bên FE)
    return {
      data : plainToInstance(JobResponseDto, processedData, { //Mặc định giá trị nhận ra từ db là plain
                                                   //Hàm này để chuyển từ plain sang 1 instance cụ thể.
      excludeExtraneousValues : true //Chỉ nhận các giá trị có trường @Expose trong dto.
    }), total,
    }
  }

  @ApiOperation({
    summary: 'Get public job details by slug',
    description: 'Retrieves job details for public viewing by job slug'
  })
  @ApiParam({ name: 'slug', type: String, description: 'Job slug' })
  @ApiResponse({ status: 200, description: 'Job details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found or inactive' })
  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    const job = await this.jobsService.detailBySlug(slug);
    if (!job || job.deleted || (job as any).status !== 'active') {
      throw new NotFoundException('Job not found');
    }
    
    // Return populated companyId as is
    let processedJob: any = typeof (job as any).toObject === 'function' ? (job as any).toObject() : { ...(job as any) };
    // Normalize ObjectIds to strings
    if (processedJob && processedJob._id && typeof processedJob._id !== 'string') processedJob._id = String(processedJob._id);
    if (processedJob && processedJob.recruiterId && typeof processedJob.recruiterId !== 'string') processedJob.recruiterId = String(processedJob.recruiterId);
    if (processedJob && processedJob.companyId && typeof processedJob.companyId === 'object' && processedJob.companyId._id && typeof processedJob.companyId._id !== 'string') {
      processedJob.companyId._id = String(processedJob.companyId._id);
    }
    if (processedJob && processedJob.jobCategoryId && typeof processedJob.jobCategoryId === 'object' && processedJob.jobCategoryId._id && typeof processedJob.jobCategoryId._id !== 'string') {
      processedJob.jobCategoryId._id = String(processedJob.jobCategoryId._id);
    }
    
    return plainToInstance(JobResponseDto, processedJob, { excludeExtraneousValues: true });
  }
}