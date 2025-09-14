// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { cloudinaryConfig } from './utils/cloudinary.config';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  dotenv.config(); // Load biến môi trường từ .env

  // Khởi tạo Cloudinary trước khi app chạy
  cloudinaryConfig();

  const app = await NestFactory.create(AppModule);

  // Dùng cookie-parser để đọc cookie (bao gồm HttpOnly cookie)
  app.use(cookieParser());

  // Cấu hình CORS linh hoạt
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); 
      return callback(null, true);
    },
    credentials: true, // Cho phép gửi cookie từ FE
  });

  // 🚀 Bật validation & transform cho DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // loại bỏ field thừa không có trong DTO
      transform: true,  // tự động cast kiểu (ví dụ string -> number)
    }),
  );

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Job Recruitment API')
    .setDescription('API documentation for Job Recruitment Application')
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Jobs', 'Job management endpoints')
    .addTag('Applications', 'Job application endpoints')
    .addTag('Companies', 'Company management endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Accounts', 'Account management endpoints')
    .addTag('Roles', 'Role management endpoints')
    .addTag('Recruiters', 'Recruiter management endpoints')
    .addTag('Upload', 'File upload endpoints')
    .addTag('CV Builder', 'CV builder and template management endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await await app.listen(process.env.PORT || 3000, '0.0.0.0');

}
bootstrap();
