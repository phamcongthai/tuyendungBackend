import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BannerOrder, BannerOrderDocument, PaymentIntent, PaymentIntentDocument } from './payments.schema';
import { Recruiter, RecruiterDocument } from '../recruiters/schemas/recruiter.schema';
import { BannerPackage, BannerPackageDocument } from '../banner-packages/schemas/banner-package.schema';
import { Banner, BannerDocument } from '../banners/schemas/banner.schema';
import { VnpayService } from 'nestjs-vnpay';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    @InjectModel(BannerOrder.name) private readonly orderModel: Model<BannerOrderDocument>,
    @InjectModel(Recruiter.name) private readonly recruiterModel: Model<RecruiterDocument>,
    @InjectModel(BannerPackage.name) private readonly pkgModel: Model<BannerPackageDocument>,
    @InjectModel(Banner.name) private readonly bannerModel: Model<BannerDocument>,
    private readonly vnpayService: VnpayService,
    @InjectModel(PaymentIntent.name) private readonly intentModel: Model<PaymentIntentDocument>,
  ) {}

  async createPaymentOrder(body: any, ipAddr: string) {
    // Return URL should point to backend endpoint for verification, then redirect to recruiter app
    const vnp_ReturnUrl = `${process.env.BACKEND_URL}/payments/vnpay/return`;

    // Validate package and recruiter
    const pkg = await this.pkgModel.findById(new Types.ObjectId(body.packageId));
    if (!pkg || !pkg.isActive) throw new BadRequestException('Gói banner không hợp lệ');

    const recruiter = await this.recruiterModel.findOne({ accountId: new Types.ObjectId(body.accountId) });
    if (!recruiter || !recruiter.companyId) throw new BadRequestException('Recruiter chưa có công ty');

    // Do NOT create banner order yet; create lightweight intent only

    const orderId = moment().format('HHmmss');
    const paymentUrl = this.vnpayService.buildPaymentUrl({
      vnp_Amount: Number(pkg.price || 0),
      vnp_IpAddr: ipAddr,
      vnp_ReturnUrl,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang`,
      vnp_BankCode: 'NCB',
      // vnp_OrderType optional with SDK; omit to avoid enum mismatch
    });

    // Log built payment URL for debugging/verification
    this.logger.log(`Built VNPay payment URL: ${paymentUrl}`);

    // Save intent mapping to create order only when payment success
    await this.intentModel.create({
      gatewayTxnRef: orderId,
      accountId: new Types.ObjectId(body.accountId),
      recruiterId: recruiter._id,
      companyId: recruiter.companyId,
      packageId: pkg._id,
      title: body.title,
      imageUrl: body.imageUrl,
      redirectUrl: body.redirectUrl || '',
      altText: body.altText || '',
    });

    return { paymentUrl, orderId: orderId };
  }

  async verifyReturn(query: any) {
    const verify = await this.vnpayService.verifyReturnUrl({ ...query });
    return {
      isSuccess: verify.isSuccess,
      orderTxnRef: query.vnp_TxnRef,
      gatewayData: query,
      message: verify.message,
    };
  }

  async updateOrderStatusByTxnRef(txnRef: string, status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED', gatewayMeta: any) {
    const existingOrder = await this.orderModel.findOne({ gatewayTxnRef: txnRef });
    if (existingOrder) {
      existingOrder.status = status;
      existingOrder.gatewayMeta = gatewayMeta || {};
      await existingOrder.save();
      return true;
    }

    if (status !== 'PAID') {
      // payment failed/cancelled -> do not create order
      return true;
    }

    // status PAID and no order yet -> create order from intent
    const intent = await this.intentModel.findOne({ gatewayTxnRef: txnRef });
    if (!intent) throw new BadRequestException('Không tìm thấy intent thanh toán');

    const pkg = await this.pkgModel.findById(intent.packageId);
    if (!pkg) throw new BadRequestException('Gói banner không hợp lệ');

    await this.orderModel.create({
      accountId: intent.accountId,
      recruiterId: intent.recruiterId,
      companyId: intent.companyId,
      packageId: intent.packageId,
      amount: pkg.price,
      paymentMethod: 'vnpay',
      status: 'PAID',
      title: intent.title,
      imageUrl: intent.imageUrl,
      redirectUrl: intent.redirectUrl,
      altText: intent.altText,
      gatewayTxnRef: txnRef,
      gatewayMeta: gatewayMeta || {},
    });

    // Optionally cleanup intent
    await this.intentModel.deleteOne({ _id: intent._id });

    return true;
  }

  async listOrders(filter: any = {}, page = 1, limit = 20) {
    const query = this.orderModel.find(filter).sort({ createdAt: -1 });
    const data = await query.skip((page - 1) * limit).limit(limit).exec();
    const total = await this.orderModel.countDocuments(filter);
    return { data, total };
  }

  async listOrdersForAccount(accountId: string, page = 1, limit = 20) {
    const filter = { accountId: new Types.ObjectId(accountId) } as any;
    const data = await this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();
    const total = await this.orderModel.countDocuments(filter);

    const bannerIds = (data.map((d: any) => d.bannerId).filter(Boolean) as Types.ObjectId[]);
    let bannerMap: Record<string, any> = {};
    if (bannerIds.length) {
      const banners = await this.bannerModel.find({ _id: { $in: bannerIds } }).lean();
      bannerMap = Object.fromEntries(banners.map((b: any) => [String(b._id), b]));
    }

    const enriched = data.map((d: any) => {
      const b = d.bannerId ? bannerMap[String(d.bannerId)] : null;
      return {
        ...d,
        banner: b
          ? {
              id: String(b._id),
              approved: !!b.approved,
              isActive: !!b.isActive,
              position: b.position,
            }
          : null,
      };
    });

    return { data: enriched, total };
  }

  async getOrderById(id: string) {
    return this.orderModel.findById(new Types.ObjectId(id));
  }

  async approveOrderAndCreateBanner(id: string) {
    const order = await this.orderModel.findById(new Types.ObjectId(id));
    if (!order) throw new BadRequestException('Không tìm thấy đơn hàng');
    if (order.status !== 'PAID') throw new BadRequestException('Đơn hàng chưa thanh toán');
    if (order.bannerId) throw new BadRequestException('Đơn hàng đã được tạo banner');

    const pkg = await this.pkgModel.findById(order.packageId);
    if (!pkg || !pkg.isActive) throw new BadRequestException('Gói banner không hợp lệ');

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (pkg.durationDays || 7) * 24 * 60 * 60 * 1000);
    const banner = await this.bannerModel.create({
      title: order.title,
      imageUrl: order.imageUrl,
      redirectUrl: order.redirectUrl,
      altText: order.altText,
      packageId: pkg._id,
      position: pkg.position,
      price: pkg.price,
      companyId: order.companyId,
      recruiterId: order.recruiterId,
      startDate,
      endDate,
      approved: true,
      isActive: true,
      rejectedReason: null,
      viewCount: 0,
      clickCount: 0,
    });

    order.bannerId = banner._id as any;
    await order.save();

    return { message: 'Đã duyệt và tạo banner', bannerId: String(banner._id) };
  }

  // helpers not needed with SDK
}