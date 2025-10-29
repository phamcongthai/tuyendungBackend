import { Body, Controller, Post, Res, UseGuards, Req, Get, BadRequestException, Query } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { RegisterForUserDto, RegisterForRecruiterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { Response } from 'express';
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { AccountsRepository } from "src/modules/accounts/repositories/accounts.repository";
import { AccountRolesRepository } from "src/modules/account_roles/repositories/account_roles.repository";
import { Types } from 'mongoose';

@ApiTags('Authentication')
@Controller("auth")
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly accountsRepo: AccountsRepository,
        private readonly accountRolesRepo: AccountRolesRepository,
    ) { };
    @ApiOperation({
        summary: 'Register new user account',
        description: 'Creates a new user account with the provided registration details'
    })
    @ApiResponse({
        status: 201,
        description: 'User successfully registered',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'User registered successfully' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        fullName: { type: 'string' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid registration data' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    @ApiBody({ type: RegisterForUserDto })
    @Post('register/user')
    async registerUser(@Body() registerDto: RegisterForUserDto) {
        return this.authService.registerUser(registerDto);
    }
    @ApiOperation({
        summary: 'Register new recruiter account',
        description: 'Creates a new recruiter account with the provided registration details'
    })
    @ApiResponse({
        status: 201,
        description: 'Recruiter successfully registered',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Recruiter registered successfully' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        fullName: { type: 'string' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid registration data' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    @ApiBody({ type: RegisterForRecruiterDto })
    @Post('register/recruiter')
    async registerRecruiter(@Body() registerDto: RegisterForRecruiterDto) {
        return this.authService.registerRecruiter(registerDto);
    }
    @ApiOperation({
        summary: 'User login',
        description: 'Authenticates user. Web receives HttpOnly cookie, mobile receives token in response.'
    })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        schema: {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        fullName: { type: 'string' },
                        roles: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiBody({ type: LoginDto })
    @Post('login')
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { token, user } = await this.authService.login(loginDto);

        const isProd = process.env.NODE_ENV === 'production';

        // 👉 Cookie cho Web (browser sẽ tự gửi kèm khi gọi API)
        // Để hỗ trợ cross-site XHR (FE và BE khác origin), cần SameSite=None và Secure
        // Lưu ý: Trình duyệt hiện đại chấp nhận Secure trên localhost
        res.cookie('tokenRecruiter', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 1000 * 60 * 60, // 1h
        });

        // 👉 Token cho Mobile (mobile sẽ lưu local storage/secure storage)
        return {
            user,
            token, // mobile dùng Authorization: Bearer <token>
        };
    }

    @ApiOperation({
        summary: 'User logout',
        description: 'Logs out user by clearing the authentication cookie'
    })
    @ApiResponse({
        status: 200,
        description: 'Logout successful',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Đăng xuất thành công' }
            }
        }
    })
    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('tokenRecruiter', '', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 0,
        });
        return { message: 'Đăng xuất thành công' };
    }
    @ApiOperation({
        summary: 'Get current user profile',
        description: 'Returns the profile information of the currently authenticated user'
    })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                fullName: { type: 'string' },
                phone: { type: 'string' },
                roles: {
                    type: 'array',
                    items: { type: 'string' }
                },
                isVerified: { type: 'boolean' },
                lastLoginAt: { type: 'string', format: 'date-time' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiBearerAuth()
    @Get('me')
    async getProfile(@Req() req) {
        // Hỗ trợ cả Authorization: Bearer và cookie HttpOnly
        const authHeader: string | undefined = req.headers?.['authorization'] || req.headers?.['Authorization'];
        let token: string | null = null;
        if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
        if (!token) {
            token = req?.cookies?.['tokenRecruiter'] || null;
        }

        if (!token) {
            // Không đăng nhập -> trả 200 với null để FE tự xử lý, tránh 401 gây redirect loop
            return null;
        }

        try {
            const payload: any = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'donthackmepls!',
            });

            if (!payload?.sub || !payload?.email) {
                return null;
            }

            const user = await this.accountsRepo.findOne(payload.sub);
            if (!user) {
                return null;
            }

            const accountId = new Types.ObjectId(payload.sub);
            const roles = await this.accountRolesRepo.findRolesByAccountId(accountId);

            return {
                id: payload.sub,
                email: payload.email,
                roles,
                fullName: user.fullName,
                phone: user.phone,
                isVerified: user.isVerified,
            };
        } catch (e) {
            // Token không hợp lệ/hết hạn -> trả null (200)
            return null;
        }
    }
    @Get('verify')
    async verifyEmail(@Query('token') token: string) {
        if (!token) throw new BadRequestException('Token không hợp lệ');
        return this.authService.verifyEmail(token);
    }
    @Post('resend-verification')
    async resend(@Body('email') email: string) {
        return this.authService.resendEmail(email);
    }
}