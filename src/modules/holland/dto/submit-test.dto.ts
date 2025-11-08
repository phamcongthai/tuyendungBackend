import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitTestDto {
  @ApiProperty({ 
    description: 'Object chứa câu trả lời: { questionId: selectedValue }',
    example: { '507f1f77bcf86cd799439011': 3, '507f1f77bcf86cd799439012': 4 }
  })
  @IsObject()
  answers: Record<string, number>;
}
