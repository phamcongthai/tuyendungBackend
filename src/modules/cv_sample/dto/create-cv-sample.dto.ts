import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCvSampleDto {
  @ApiProperty({
    description: 'Nội dung HTML của CV mẫu',
    example: '<div class="cv-container">...</div>',
  })
  @IsString()
  @IsNotEmpty()
  html: string;

  @ApiProperty({
    description: 'CSS cho CV mẫu',
    example: '.cv-container { font-family: Arial; }',
  })
  @IsString()
  @IsNotEmpty()
  css: string;

  @ApiProperty({
    description: 'Tên CV mẫu',
    example: 'CV Mẫu Cơ Bản',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Tiêu đề CV mẫu',
    example: 'CV Template - Modern Design',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

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
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
