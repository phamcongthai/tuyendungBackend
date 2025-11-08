import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class MatchScoreController {
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
    return this.aiService.computeMatchScore(cv, jd);
  }
}












