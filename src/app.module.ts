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
import { AiModule } from './modules/ai/ai.module';
import { JobPackagesModule } from './modules/job-packages/job-packages.module';
import { BannersModule } from './modules/banners/banners.module';
import { BannerPackagesModule } from './modules/banner-packages/banner-packages.module';
import { PaymentsModule} from './modules/paymentsModule/payments.module';
import { VnpayModule } from 'nestjs-vnpay';
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
    BlogsModule,
    AiModule,
    JobPackagesModule,
    BannersModule,
    BannerPackagesModule,
    VnpayModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const tmn = config.get<string>('VNPAY_TMN_CODE') || config.get<string>('vnp_TmnCode');
        const secret = config.get<string>('VNPAY_SECURE_SECRET') || config.get<string>('vnp_HashSecret');
        if (!tmn || !secret) {
          throw new Error('Missing VNPay credentials (VNPAY_TMN_CODE / VNPAY_SECURE_SECRET)');
        }
        return {
          tmnCode: tmn,
          secureSecret: secret,
          vnpayHost: config.get<string>('VNPAY_HOST') || 'https://sandbox.vnpayment.vn',
          testMode: (config.get<string>('NODE_ENV') || process.env.NODE_ENV) !== 'production',
        };
      },
      inject: [ConfigService],
    }),
    PaymentsModule,
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
