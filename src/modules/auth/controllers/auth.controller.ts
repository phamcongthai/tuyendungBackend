import { Body, Controller, Post, Res, UseGuards, Req, Get, BadRequestException, Query } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { RegisterForUserDto, RegisterForRecruiterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { Response } from 'express';
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { };
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
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
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
        res.cookie('token', '', {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
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
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req) {
        return req.user;
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