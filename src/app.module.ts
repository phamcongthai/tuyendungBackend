// src/app.module.ts
import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RecruiterModule } from './modules/recruiters/recruiter.module';
import { cloudinaryConfig } from './utils/cloudinary.config';
import { JobsModule } from './modules/jobs/jobs.module';
import { JobCategoriesModule } from './modules/job-categories/job-categories.module';
import { UsersModule } from './modules/users/users.module';
import { TmpModule } from './tmp/tmp.module';
import { AccountsModule } from './modules/accounts/account.module';
import { RolesModule } from './modules/roles/roles.module';
import { AccountRolesModule } from './modules/account_roles/account_roles.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboards/dashboard.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { CvSampleModule } from './modules/cv_sample/cv-sample.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SiteSettingsModule } from './modules/site-settings/site-settings.module';
import { BlogsModule } from './modules/blogs/blogs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL'),
        connectionFactory: (connection) => {
          Logger.log('✅ Đã kết nối MongoDB thành công!', 'MongoDB');
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    RecruiterModule,
    JobsModule,
    JobCategoriesModule,
    UsersModule,
    TmpModule,
    AccountsModule,
    RolesModule,
    AccountRolesModule,
    AuthModule,
    DashboardModule,
    CompaniesModule,
    ApplicationsModule,
    CvSampleModule,
    UploadModule,
    NotificationsModule,
    SiteSettingsModule,
    BlogsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    // Initialize Cloudinary configuration
    cloudinaryConfig();
    Logger.log('✅ Đã khởi tạo Cloudinary thành công!', 'Cloudinary');
  }
}
