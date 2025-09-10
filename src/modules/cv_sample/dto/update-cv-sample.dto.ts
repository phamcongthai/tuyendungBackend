import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCvSampleDto {
  @ApiProperty({
    description: 'Nội dung HTML của CV mẫu',
    example: '<div class="cv-container">...</div>',
    required: false,
  })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiProperty({
    description: 'CSS cho CV mẫu',
    example: '.cv-container { font-family: Arial; }',
    required: false,
  })
  @IsString()
  @IsOptional()
  css?: string;

  @ApiProperty({
    description: 'Tên CV mẫu',
    example: 'CV Mẫu Cơ Bản',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Tiêu đề CV mẫu',
    example: 'CV Template - Modern Design',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Mô tả CV mẫu',
    example: 'CV mẫu đơn giản, phù hợp cho sinh viên mới ra trường',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'URL hình ảnh demo của CV mẫu',
    example: 'https://example.com/demo-cv-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  demoImage?: string;

  @ApiProperty({
    description: 'Trạng thái hoạt động',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
