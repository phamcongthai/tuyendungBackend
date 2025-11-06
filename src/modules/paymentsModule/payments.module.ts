import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VnpayModule } from 'nestjs-vnpay';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './controller/payments.controller';
import { AdminBannerOrdersController } from './controller/admin.banner-orders.controller';
import { RecruiterBannerOrdersController } from './controller/recruiter.banner-orders.controller';
import { Recruiter, RecruiterSchema } from '../recruiters/schemas/recruiter.schema';
import { BannerOrder, BannerOrderSchema, PaymentIntent, PaymentIntentSchema } from './payments.schema';
import { BannerPackage, BannerPackageSchema } from '../banner-packages/schemas/banner-package.schema';
import { Banner, BannerSchema } from '../banners/schemas/banner.schema';

@Module({
  imports: [
    ConfigModule,
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
    MongooseModule.forFeature([
      { name: Recruiter.name, schema: RecruiterSchema },
      { name: BannerOrder.name, schema: BannerOrderSchema },
      { name: PaymentIntent.name, schema: PaymentIntentSchema },
      { name: BannerPackage.name, schema: BannerPackageSchema },
      { name: Banner.name, schema: BannerSchema },
    ]),
  ],
  controllers: [PaymentsController, AdminBannerOrdersController, RecruiterBannerOrdersController],
  providers: [PaymentsService],
  exports: [],
})
export class PaymentsModule {}
