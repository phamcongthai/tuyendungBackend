import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('match_score')
  @ApiOperation({ summary: 'Tính điểm phù hợp giữa CV và JD (0..100)' })
  @ApiBody({
    schema: {
      properties: {
        cv: {
          type: 'object',
          properties: {
            desiredPosition: { type: 'string' },
            objective: { type: 'string' },
            experienceYears: { type: 'number' },
            level: { type: 'string', example: 'fresher' },
          },
          required: ['desiredPosition', 'objective', 'experienceYears', 'level'],
        },
        jd: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            requirements: { type: 'string' },
          },
          required: ['title', 'requirements'],
        },
      },
      required: ['cv', 'jd'],
    },
  })
  async matchScore(@Body() body: any) {
    const { cv, jd } = body || {};
    try {
      // Log input data before analysis
      // Note: Ensure sensitive data is not logged in production environments
      // This log is for debugging per user's request
      // eslint-disable-next-line no-console
      console.log('[AI] /match_score input =>', {
        cv,
        jd,
      });
    } catch {}
    return this.aiService.computeMatchScore(cv, jd);
  }

  @Get('rank-applicants/:jobId')
  @ApiOperation({ summary: 'Xếp hạng ứng viên theo điểm phù hợp (desc) cho 1 Job' })
  @ApiParam({ name: 'jobId', required: true })
  async rankApplicants(@Param('jobId') jobId: string) {
    return this.aiService.rankApplicantsForJob(jobId);
  }
}


