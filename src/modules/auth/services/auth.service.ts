import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Types } from 'mongoose';
import { Model } from 'mongoose';
import { RegisterForUserDto, RegisterForRecruiterDto } from "../dto/register.dto";
import { AccountsService } from './../../accounts/accounts.service';
import { UsersService } from './../../users/user.service';
import { LoginDto } from "../dto/login.dto";
import { EmailVerification, EmailVerificationDocument } from "../schemas/email_verifications.schema"
import * as crypto from 'crypto';
import { sendVerificationEmail } from "src/utils/sendEmail.util";

@Injectable()
export class AuthService {
    constructor(
        private readonly AccountsService: AccountsService,
        @InjectModel(EmailVerification.name) private emailVerificationModel: Model<EmailVerificationDocument>,
        private readonly UsersService: UsersService,
    ) {}

    async registerUser(registerDto: RegisterForUserDto) {
        const user = await this.AccountsService.registerForUser(registerDto);

        // Always initialize blank user profile immediately after account creation
        try {
            console.log('[AuthService] initBlankUser start for account:', String(user._id));
            await this.UsersService.initBlankUser(String(user._id), registerDto.fullName);
            console.log('[AuthService] initBlankUser success for account:', String(user._id));
        } catch (e) {
            console.error('[AuthService] initBlankUser failed for account:', String(user._id), e);
            // non-blocking: do not fail registration if profile init fails
        }

        // Best-effort email verification creation and sending
        try {
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);

            await this.emailVerificationModel.create({
                accountId: user._id,
                token,
                expiresAt,
            });

            await sendVerificationEmail(user.email, token);
        } catch (e) {
            console.error('[AuthService] email verification setup failed for account:', String(user._id), e);
            // non-blocking: email setup can be retried later via resend endpoint
        }

        return {
            message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực.",
            user
        };
    }

    async registerRecruiter(registerDto: RegisterForRecruiterDto) {
        try {
            console.log('Starting recruiter registration with data:', registerDto);
            
            const recruiter = await this.AccountsService.registerForRecruiter(registerDto);
            console.log('Account created successfully:', recruiter._id);

            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);

            await this.emailVerificationModel.create({
                accountId: recruiter._id,
                token,
                expiresAt,
            });
            console.log('Email verification record created');

            try {
                await sendVerificationEmail(recruiter.email, token);
                console.log('Verification email sent successfully');
            } catch (emailError) {
                console.error('Error sending verification email:', emailError);
                // Không throw error để không ảnh hưởng đến việc tạo account
            }

            // Also create blank user profile for recruiter if needed (optional)
            try {
                await this.UsersService.initBlankUser(String(recruiter._id), registerDto.fullName);
                console.log('Blank user profile created successfully');
            } catch (e) {
                console.error('Error creating blank user profile:', e);
                // non-blocking
            }

            return {
                message: "Đăng ký thành công. Vui lòng xác thực email.",
                recruiter
            };
        } catch (error) {
            console.error('Error in registerRecruiter:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }

    async login(dto: LoginDto) {
        return await this.AccountsService.login(dto);
    }

    async verifyEmail(token: string) {
        const data = await this.emailVerificationModel.findOne({ token: token });
        if (!data) {
            throw new BadRequestException('Token không hợp lệ');
        }
        if (data.expiresAt < new Date()) {
            throw new BadRequestException('Token đã hết hạn');
        }
        await this.AccountsService.update(data.accountId, { isVerified: true });
        await this.emailVerificationModel.deleteOne({ _id: data._id });
        return {
            message: "Xác thực email thành công!"
        }
    }

    async resendEmail(email: string) {
        const account = await this.AccountsService.findByEmail(email);
        if (!account) {
            throw new NotFoundException("Tài khoản không tồn tại!");
        }
        if (account.isVerified) {
            throw new BadRequestException("Tài khoản đã được xác thực rồi!");
        }

        // Xóa token cũ 
        await this.emailVerificationModel.deleteMany({ accountId: account._id });

        // Tạo token mới
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        await this.emailVerificationModel.create({
            accountId: account._id,
            token,
            expiresAt,
        });

        // Gửi mail
        await sendVerificationEmail(account.email, token);

        return { message: 'Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.' };
    }
}
