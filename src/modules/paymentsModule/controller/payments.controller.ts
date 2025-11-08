import { Controller, Post, Body, Req, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentsService } from '../payments.service';

@Controller('payments/vnpay')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  async create(
    @Req() req,
    @Body()
    body: {
      packageId: string;
      accountId: string; // recruiter account id (fallback if no auth)
      title: string;
      imageUrl: string;
      redirectUrl?: string;
      altText?: string;
    },
  ) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const { paymentUrl, orderId } = await this.paymentsService.createPaymentOrder(body, ip as string);
      return { success: true, paymentUrl, orderId };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Redirect directly to VNPay payment page (for browser navigation)
  @Get('create-redirect')
  async createRedirect(
    @Req() req,
    @Res() res,
    @Query()
    query: {
      packageId: string;
      accountId: string;
      title: string;
      imageUrl: string;
      redirectUrl?: string;
      altText?: string;
    },
  ) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const { paymentUrl } = await this.paymentsService.createPaymentOrder(query, ip as string);
      return res.redirect(paymentUrl);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('return')
  async handleReturn(@Query() query, @Res() res) {
    try {
      const verifyResult = await this.paymentsService.verifyReturn(query);
      if (verifyResult.isSuccess) {
        await this.paymentsService.updateOrderStatusByTxnRef(verifyResult.orderTxnRef, 'PAID', verifyResult.gatewayData);
        // Redirect to recruiter's order management page after successful payment
        const recruiterAppUrl = process.env.RECRUITER_APP_URL || process.env.FRONTEND_RECRUITER_URL;
        const url = `${recruiterAppUrl}/banners/orders?payment=success&txnRef=${verifyResult.orderTxnRef}`;
        return res.redirect(url);
      } else {
        await this.paymentsService.updateOrderStatusByTxnRef(verifyResult.orderTxnRef, 'FAILED', verifyResult.gatewayData);
        // Redirect to recruiter's order management page even on failure
        const recruiterAppUrl = process.env.RECRUITER_APP_URL || process.env.FRONTEND_RECRUITER_URL;
        const url = `${recruiterAppUrl}/banners/orders?payment=failed&txnRef=${verifyResult.orderTxnRef}`;
        return res.redirect(url);
      }
    } catch (error) {
      return res.redirect(
        `${process.env.RECRUITER_APP_URL || process.env.FRONTEND_RECRUITER_URL}/banners/orders?payment=error&message=${error.message}`,
      );
    }
  }

  // FE can call this to verify the VNPay params present in the URL
  @Get('verify')
  async verifyReturnForClient(@Query() query) {
    const verifyResult = await this.paymentsService.verifyReturn(query);
    try {
      await this.paymentsService.updateOrderStatusByTxnRef(
        verifyResult.orderTxnRef,
        verifyResult.isSuccess ? 'PAID' : 'FAILED',
        verifyResult.gatewayData,
      );
    } catch {}
    return {
      success: verifyResult.isSuccess,
      message: verifyResult.message,
      data: {
        txnRef: verifyResult.orderTxnRef,
        responseCode: query?.vnp_ResponseCode,
      },
    };
  }

  // ================= JOB FEATURE PAYMENT ROUTES =================

  @Post('job-feature/create')
  async createJobFeature(
    @Req() req,
    @Body() body: { packageId: string; jobId: string; accountId: string },
  ) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { paymentUrl, orderId } = await this.paymentsService.createJobFeaturePayment(body, ip as string);
    return { success: true, paymentUrl, orderId };
  }

  @Get('job-feature/create-redirect')
  async createJobFeatureRedirect(
    @Req() req,
    @Res() res,
    @Query() query: { packageId: string; jobId: string; accountId: string },
  ) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { paymentUrl } = await this.paymentsService.createJobFeaturePayment(query as any, ip as string);
    return res.redirect(paymentUrl);
  }

  @Get('job-feature/return')
  async handleJobFeatureReturn(@Query() query, @Res() res) {
    try {
      const verifyResult = await this.paymentsService.verifyReturn(query);
      if (verifyResult.isSuccess) {
        await this.paymentsService.updateJobFeatureOrderStatusByTxnRef(verifyResult.orderTxnRef, 'PAID', verifyResult.gatewayData);
        const recruiterAppUrl = process.env.RECRUITER_APP_URL || process.env.FRONTEND_RECRUITER_URL;
        const url = `${recruiterAppUrl}/jobs?payment=success&txnRef=${verifyResult.orderTxnRef}`;
        return res.redirect(url);
      } else {
        await this.paymentsService.updateJobFeatureOrderStatusByTxnRef(verifyResult.orderTxnRef, 'FAILED', verifyResult.gatewayData);
        const recruiterAppUrl = process.env.RECRUITER_APP_URL || process.env.FRONTEND_RECRUITER_URL;
        const url = `${recruiterAppUrl}/jobs?payment=failed&txnRef=${verifyResult.orderTxnRef}`;
        return res.redirect(url);
      }
    } catch (error) {
      return res.redirect(
        `${process.env.RECRUITER_APP_URL || process.env.FRONTEND_RECRUITER_URL}/jobs?payment=error&message=${error.message}`,
      );
    }
  }

  @Get('job-feature/verify')
  async verifyJobFeatureReturn(@Query() query) {
    const verifyResult = await this.paymentsService.verifyReturn(query);
    try {
      await this.paymentsService.updateJobFeatureOrderStatusByTxnRef(
        verifyResult.orderTxnRef,
        verifyResult.isSuccess ? 'PAID' : 'FAILED',
        verifyResult.gatewayData,
      );
    } catch {}
    return {
      success: verifyResult.isSuccess,
      message: verifyResult.message,
      data: {
        txnRef: verifyResult.orderTxnRef,
        responseCode: query?.vnp_ResponseCode,
      },
    };
  }
}
