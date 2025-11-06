import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UploadedFiles,
    UseInterceptors,
    Param,
    Patch,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { FilesInterceptor } from '@nestjs/platform-express';
  import { JobsService } from '../jobs.service';
  import { CreateJobDto } from '../dto/request/create-job.dto';
  import { UpdateJobDto } from '../dto/request/update-job.dto';
import { JobResponseDto } from '../dto/response/job-response.dto';
import { plainToInstance } from 'class-transformer';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
    ApiParam,
    ApiBody,
    ApiConsumes,
  } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
  import { RolesGuard } from '../../../common/guards/roles.guard';
  import { Roles } from '../../../common/decorators/roles.decorator';
  
  @ApiTags('Recruiter Jobs')
  @Controller('recruiters/jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Recruiter')
  export class RecruiterJobsController {
    constructor(private readonly jobsService: JobsService) {}
  
    private normalizeJobIds(job: any) {
      if (!job) return job;
      const obj = typeof job.toObject === 'function' ? job.toObject() : { ...job };
      // _id
      if (obj._id && typeof obj._id !== 'string') {
        obj._id = String(obj._id);
      }
      // recruiterId
      if (obj.recruiterId && typeof obj.recruiterId !== 'string') {
        obj.recruiterId = String(obj.recruiterId);
      }
      // companyId can be ObjectId or populated object
      if (obj.companyId) {
        if (typeof obj.companyId === 'object') {
          const companyObj = typeof obj.companyId.toObject === 'function'
            ? obj.companyId.toObject()
            : { ...obj.companyId };
          if (companyObj._id && typeof companyObj._id !== 'string') {
            companyObj._id = String(companyObj._id);
          }
          obj.companyId = companyObj;
        } else if (typeof obj.companyId !== 'string') {
          obj.companyId = String(obj.companyId);
        }
      }
      // jobCategoryId can be ObjectId or populated object
      if (obj.jobCategoryId) {
        if (typeof obj.jobCategoryId === 'object') {
          const categoryObj = typeof obj.jobCategoryId.toObject === 'function'
            ? obj.jobCategoryId.toObject()
            : { ...obj.jobCategoryId };
          if (categoryObj._id && typeof categoryObj._id !== 'string') {
            categoryObj._id = String(categoryObj._id);
          }
          obj.jobCategoryId = categoryObj;
        } else if (typeof obj.jobCategoryId !== 'string') {
          obj.jobCategoryId = String(obj.jobCategoryId);
        }
      }
      return obj;
    }
  
    @ApiOperation({
      summary: 'Get all jobs for recruiter',
      description: 'Recruiter can view all their jobs with pagination and filters',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by job title' })
    @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by job status (draft, active, expired)' })
    @ApiQuery({ name: 'jobType', required: false, type: String, description: 'Filter by job type (fulltime, parttime, internship, contract, freelance)' })
    @ApiQuery({ name: 'workingMode', required: false, type: String, description: 'Filter by working mode (onsite, remote, hybrid)' })
    @ApiQuery({ name: 'jobCategoryId', required: false, type: String, description: 'Filter by job category ID' })
    @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
    @Get()
    async findAll(
      @Req() req: any, // lấy recruiterId từ token (JwtGuard)
      @Query('page') page = 1,
      @Query('limit') limit = 10,
      @Query('search') search = '',
      @Query('status') status?: string,
      @Query('jobType') jobType?: string,
      @Query('workingMode') workingMode?: string,
      @Query('jobCategoryId') jobCategoryId?: string,
      @Query('location') location?: string,
      @Query('categories') categories?: string | string[],
      @Query('level') level?: string,
      @Query('salaryMin') salaryMin?: string,
      @Query('salaryMax') salaryMax?: string,
      @Query('experience') experience?: string,
    ) {
      const recruiterId = req.user.id;
      const { data, total } = await this.jobsService.findAllByRecruiter(
        recruiterId, 
        Number(page), 
        Number(limit), 
        search, 
        status,
        jobType,
        workingMode,
        jobCategoryId,
        location,
        categories,
        level,
        salaryMin !== undefined ? Number(salaryMin) : undefined,
        salaryMax !== undefined ? Number(salaryMax) : undefined,
        experience,
      );

      // Normalize IDs to strings for client compatibility
      const processedData = data.map((job: any) => this.normalizeJobIds(job));

      return {
        data: plainToInstance(JobResponseDto, processedData, {
          excludeExtraneousValues: true
        }),
        total
      };
    }
  
    @ApiOperation({
      summary: 'Create new job',
      description: 'Recruiter creates a new job posting with optional file uploads',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      type: CreateJobDto,
      description: 'Job creation data with optional files',
    })
    @ApiResponse({ status: 201, description: 'Job created successfully' })
    @Post()
    @UseInterceptors(FilesInterceptor('files'))
    async create(
      @Req() req: any,
      @Body() createJobDto: CreateJobDto,
      @UploadedFiles() files?: Express.Multer.File[],
    ) {
      console.log('🚨 POST /recruiters/jobs - CREATING NEW JOB!');
      console.log('🚨 Request body:', createJobDto);
      console.log('🚨 Recruiter ID:', req.user.id);
      const recruiterId = req.user.id;
      // Ensure body cannot override recruiter/company by accident
      (createJobDto as any).recruiterId = undefined;
      (createJobDto as any).companyId = undefined;
      const job = await this.jobsService.createByRecruiter(recruiterId, createJobDto, files);
      
      // Normalize IDs to strings for client compatibility
      let processedJob: any = this.normalizeJobIds(job as any);
      
      return plainToInstance(JobResponseDto, processedJob, { excludeExtraneousValues: true });
    }
  
    @ApiOperation({
      summary: 'Update job',
      description: 'Recruiter updates one of their jobs',
    })
    @ApiParam({ name: 'id', type: String, description: 'Job ID to update' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      type: UpdateJobDto,
      description: 'Job update data with optional files',
    })
    @ApiResponse({ status: 200, description: 'Job updated successfully' })
    @Patch(':id')
    @UseInterceptors(FilesInterceptor('files'))
    async update(
      @Req() req: any,
      @Param('id') id: string,
      @Body() updateJobDto: UpdateJobDto,
      @UploadedFiles() files?: Express.Multer.File[],
    ) {
      const recruiterId = req.user.id;
      const job = await this.jobsService.updateByRecruiter(recruiterId, id, updateJobDto, files);
      
      // Normalize IDs to strings for client compatibility
      let processedJob: any = this.normalizeJobIds(job as any);
      
      return plainToInstance(JobResponseDto, processedJob, { excludeExtraneousValues: true });
    }
  
    @ApiOperation({
      summary: 'Get job details',
      description: 'Recruiter retrieves details of their own job',
    })
    @ApiParam({ name: 'id', type: String, description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'Job details retrieved successfully' })
    @Get(':id')
    async detail(@Req() req: any, @Param('id') id: string) {
      const recruiterId = req.user.id;
      const job = await this.jobsService.detailByRecruiter(recruiterId, id);
      
      // Convert recruiterId from ObjectId to string for client compatibility
      let processedJob: any = typeof (job as any).toObject === 'function' ? (job as any).toObject() : { ...(job as any) };
      // Only convert recruiterId to string
      if (processedJob && processedJob.recruiterId && typeof processedJob.recruiterId !== 'string') {
        processedJob.recruiterId = String(processedJob.recruiterId);
      }
      
      return plainToInstance(JobResponseDto, processedJob, { excludeExtraneousValues: true });
    }
  
    @ApiOperation({
      summary: 'Delete job (soft delete)',
      description: 'Recruiter soft deletes their job',
    })
    @ApiParam({ name: 'id', type: String, description: 'Job ID to delete' })
    @ApiResponse({ status: 200, description: 'Job deleted successfully' })
    @Patch('delete/:id')
    async delete(@Req() req: any, @Param('id') id: string) {
      const recruiterId = req.user.id;
      return this.jobsService.deleteByRecruiter(recruiterId, id);
    }
  
    @ApiOperation({
      summary: 'Toggle job status',
      description: 'Recruiter toggles job status between active and draft',
    })
    @ApiParam({ name: 'id', type: String, description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'Job status updated successfully' })
    @Patch('toggle-status/:id')
    async toggleStatus(@Req() req: any, @Param('id') id: string) {
      const recruiterId = req.user.id;
      return this.jobsService.toggleStatusByRecruiter(recruiterId, id);
    }
  }
  
