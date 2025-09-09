import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { JobCategoriesSeeder } from './job-categories.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('Starting seeders...');
    
    // Run job categories seeder
    const jobCategoriesSeeder = app.get(JobCategoriesSeeder);
    await jobCategoriesSeeder.seed();
    
    console.log('All seeders completed successfully!');
  } catch (error) {
    console.error('Error running seeders:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
