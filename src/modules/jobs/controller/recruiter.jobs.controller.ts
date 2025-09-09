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
  
    @ApiOperation({
      summary: 'Get all jobs for recruiter',
      description: 'Recruiter can view all their jobs with pagination and filters',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by job title' })
    @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by job status (active, inactive)' })
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
    ) {
      const recruiterId = req.user.id;
      return this.jobsService.findAllByRecruiter(
        recruiterId, 
        Number(page), 
        Number(limit), 
        search, 
        status,
        jobType,
        workingMode,
        jobCategoryId
      );
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
      const recruiterId = req.user.id;
      return this.jobsService.createByRecruiter(recruiterId, createJobDto, files);
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
      return this.jobsService.updateByRecruiter(recruiterId, id, updateJobDto, files);
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
      return this.jobsService.detailByRecruiter(recruiterId, id);
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
      description: 'Recruiter toggles job status between ACTIVE and INACTIVE',
    })
    @ApiParam({ name: 'id', type: String, description: 'Job ID' })
    @ApiResponse({ status: 200, description: 'Job status updated successfully' })
    @Patch('toggle-status/:id')
    async toggleStatus(@Req() req: any, @Param('id') id: string) {
      const recruiterId = req.user.id;
      return this.jobsService.toggleStatusByRecruiter(recruiterId, id);
    }
  }
  
