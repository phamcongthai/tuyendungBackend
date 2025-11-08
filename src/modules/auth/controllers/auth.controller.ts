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
import axios from 'axios';
import { RolesRepository } from "src/modules/roles/repositories/roles.repository";
import { UsersRepository } from "src/modules/users/repositories/users.repository";
import { RecruiterRepository } from "src/modules/recruiters/repositories/recruiters.repository";
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountsDocument } from 'src/modules/accounts/schema/account.schema';

@ApiTags('Authentication')
@Controller("auth")
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly accountsRepo: AccountsRepository,
        private readonly accountRolesRepo: AccountRolesRepository,
        private readonly rolesRepo: RolesRepository,
        private readonly usersRepo: UsersRepository,
        private readonly recruiterRepo: RecruiterRepository,
        @InjectModel(Account.name) private readonly accountModel: Model<AccountsDocument>,
    ) { };
    
    // ================= GOOGLE OAUTH2 =================
    @ApiOperation({ summary: 'Start Google OAuth2 login', description: 'Redirects to Google OAuth2 consent' })
    @Get('google')
    async googleAuth(@Res() res: Response, @Query('client_id') qClientId?: string, @Query('redirect_uri') qRedirectUri?: string, @Query('state') state?: string) {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const redirectUri = qRedirectUri || `${backendUrl}/auth/google/callback`;
        const clientId = qClientId || process.env.GOOGLE_CLIENT_ID || '905114282586-lj1n3t68peq5nq8amurj5h7a24u0e5hu.apps.googleusercontent.com';
        
        // Debug logging
        console.log('Google Auth Start Debug:', {
            clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
            qClientId: qClientId ? `${qClientId.substring(0, 10)}...` : 'NOT_PROVIDED',
            envClientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'MISSING_FROM_ENV',
            backendUrl,
            redirectUri
        });
        
        if (!clientId) throw new BadRequestException('Missing Google client_id');

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent',
        });
        if (state) params.set('state', state);
        const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        return res.redirect(url);
    }

    @ApiOperation({ summary: 'Google OAuth2 callback', description: 'Exchanges authorization code for tokens, creates/updates account, sets JWT cookie and redirects to FE' })
    @Get('google/callback')
    async googleCallback(@Query('code') code: string, @Res() res: Response) {
        if (!code) throw new BadRequestException('Missing authorization code');

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const redirectUri = `${backendUrl}/auth/google/callback`;
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '905114282586-lj1n3t68peq5nq8amurj5h7a24u0e5hu.apps.googleusercontent.com';
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
        
        // Debug logging
        console.log('Google OAuth Debug:', {
            clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
            clientSecret: clientSecret ? `${clientSecret.substring(0, 10)}...` : 'MISSING',
            backendUrl,
            redirectUri
        });
        
        if (!clientId || !clientSecret) {
            throw new BadRequestException(`Google OAuth credentials not configured. ClientId: ${!!clientId}, ClientSecret: ${!!clientSecret}`);
        }

        // 1) Exchange code for tokens
        console.log('=== STEP 1: Exchange code for tokens ===');
        const tokenResp = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }, { headers: { 'Content-Type': 'application/json' } });

        console.log('Google token response:', {
            status: tokenResp.status,
            data: tokenResp.data
        });

        const { access_token } = tokenResp.data || {};
        if (!access_token) throw new BadRequestException('Failed to obtain access token from Google');

        // 2) Fetch userinfo
        console.log('=== STEP 2: Fetch userinfo ===');
        const userinfoResp = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        
        console.log('Google userinfo response:', {
            status: userinfoResp.status,
            data: userinfoResp.data
        });

        const { email, name, picture, sub } = userinfoResp.data || {};
        console.log('Extracted userinfo:', { email, name, picture, sub });
        
        if (!email || !sub) throw new BadRequestException('Google userinfo missing email or sub');

        // 3) Find or create account and user
        console.log('=== STEP 3: Find or create account ===');
        let account = await this.accountsRepo.findByEmail(email);
        console.log('Existing account found:', !!account);
        
        if (account) {
            console.log('Existing account details:', {
                id: (account as any)._id,
                email: (account as any).email,
                provider: (account as any).provider,
                providerId: (account as any).providerId,
                isVerified: (account as any).isVerified
            });
        }
        
        if (!account) {
            console.log('Creating new Google account and user for:', email);
            
            // Ensure default 'User' role exists
            let userRole: any = await this.rolesRepo.findByName('User');
            console.log('User role found:', !!userRole);
            if (!userRole) {
                console.log('Creating User role...');
                userRole = await this.rolesRepo.create({ name: 'User', permissions: [] } as any);
                console.log('User role created:', userRole);
            }

            // Create Account with Google provider
            console.log('Creating account with data:', {
                email,
                fullName: name || email.split('@')[0],
                provider: 'google',
                providerId: sub,
                isVerified: true
            });
            
            try {
                const createdAccount = await this.accountModel.create({
                    email,
                    fullName: name || email.split('@')[0],
                    password: '', // Empty for OAuth accounts
                    provider: 'google',
                    providerId: sub,
                    isVerified: true,
                    lastLoginAt: new Date(),
                });
                console.log('Account created successfully:', {
                    id: createdAccount._id,
                    email: createdAccount.email,
                    provider: createdAccount.provider
                });

                // Assign 'User' role to account
                try {
                    await this.accountRolesRepo.create({
                        accountId: new Types.ObjectId(String(createdAccount._id)),
                        roleId: new Types.ObjectId(String(userRole._id)),
                    } as any);
                    console.log('Role assigned successfully');
                } catch (error) {
                    console.log('Role assignment failed:', error);
                }

                // Create User profile linked to Account with Google avatar
                try {
                    const userProfile = await this.usersRepo.initBlankUser(
                        String(createdAccount._id),
                        name || email.split('@')[0]
                    );
                    
                    // Set Google profile picture as avatar if available
                    if (picture && userProfile) {
                        try {
                            await this.usersRepo.setAvatarByAccountId(
                                String(createdAccount._id),
                                picture
                            );
                            console.log('Google avatar set for user:', picture);
                        } catch (avatarError) {
                            console.log('Failed to set Google avatar:', avatarError);
                        }
                    }
                    
                    console.log('User profile created for account:', createdAccount._id);
                } catch (error) {
                    console.log('User profile creation failed:', error);
                }

                account = (await this.accountsRepo.findOne(String(createdAccount._id))) as any;
                
            } catch (error) {
                console.log('Account creation failed:', error);
                throw new BadRequestException('Failed to create Google account: ' + error.message);
            }
        } else {
            console.log('Existing account found:', email);
            
            // Check if account needs Google provider info
            if (!(account as any).provider || (account as any).provider !== 'google') {
                console.log('Updating existing account with Google provider info...');
                try {
                    await this.accountsRepo.updateById(String((account as any)._id), {
                        provider: 'google',
                        providerId: sub,
                        isVerified: true,
                        lastLoginAt: new Date()
                    } as any);
                    console.log('Account updated with Google provider info');
                } catch (error) {
                    console.log('Failed to update account with Google info:', error);
                }
            } else {
                console.log('Account already has Google provider info');
                // Just update lastLoginAt for existing Google accounts
                try {
                    await this.accountsRepo.updateById(String((account as any)._id), {
                        lastLoginAt: new Date()
                    } as any);
                } catch (error) {
                    console.log('Failed to update lastLoginAt:', error);
                }
            }
            
            // Ensure User profile exists for this account and update avatar
            try {
                const existingUser = await this.usersRepo.initBlankUser(
                    String((account as any)._id),
                    name || (account as any).fullName || email.split('@')[0]
                );
                
                // Update avatar with Google profile picture if available
                if (picture && existingUser) {
                    try {
                        await this.usersRepo.setAvatarByAccountId(
                            String((account as any)._id),
                            picture
                        );
                        console.log('Google avatar updated for existing user:', picture);
                    } catch (avatarError) {
                        console.log('Failed to update Google avatar:', avatarError);
                    }
                }
                
                console.log('User profile ensured for account:', (account as any)._id);
            } catch (error) {
                console.log('User profile creation/check failed:', error);
            }
        }

        // 4) Build JWT and set cookie
        const roles = await this.accountRolesRepo.findRolesByAccountId(new Types.ObjectId(String((account as any)._id)));
        const payload = {
            sub: String((account as any)._id),
            email: (account as any).email,
            roles,
        };
        const token = this.jwtService.sign(payload);

        res.cookie('tokenRecruiter', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 1000 * 60 * 60, // 1h
        });

        // 5) Redirect to FE; FE can call /auth/me to get user details
        const feUrl = process.env.FRONTEND_CLIENT_URL || 'http://localhost:5175';
        return res.redirect(`${feUrl}/login?oauth=success`);
    }

    // ================= GOOGLE OAUTH2 FOR RECRUITER =================
    @ApiOperation({ summary: 'Start Google OAuth2 login for recruiter', description: 'Redirects to Google OAuth2 consent for recruiter' })
    @Get('google/recruiter')
    async googleAuthRecruiter(@Res() res: Response, @Query('client_id') qClientId?: string, @Query('redirect_uri') qRedirectUri?: string, @Query('state') state?: string) {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const redirectUri = qRedirectUri || `${backendUrl}/auth/google/recruiter/callback`;
        const clientId = qClientId || process.env.GOOGLE_CLIENT_ID || '905114282586-lj1n3t68peq5nq8amurj5h7a24u0e5hu.apps.googleusercontent.com';
        
        console.log('Google Auth Recruiter Start Debug:', {
            clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
            backendUrl,
            redirectUri
        });
        
        if (!clientId) throw new BadRequestException('Missing Google client_id');

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent',
        });
        if (state) params.set('state', state);
        const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        return res.redirect(url);
    }

    @ApiOperation({ summary: 'Google OAuth2 callback for recruiter', description: 'Exchanges authorization code for tokens, creates/updates account with Recruiter role, creates recruiter profile, sets JWT cookie and redirects to recruiter FE' })
    @Get('google/recruiter/callback')
    async googleCallbackRecruiter(@Query('code') code: string, @Res() res: Response) {
        if (!code) throw new BadRequestException('Missing authorization code');

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const redirectUri = `${backendUrl}/auth/google/recruiter/callback`;
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '905114282586-lj1n3t68peq5nq8amurj5h7a24u0e5hu.apps.googleusercontent.com';
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
        
        console.log('Google OAuth Recruiter Debug:', {
            clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
            clientSecret: clientSecret ? `${clientSecret.substring(0, 10)}...` : 'MISSING',
            backendUrl,
            redirectUri
        });
        
        if (!clientId || !clientSecret) {
            throw new BadRequestException(`Google OAuth credentials not configured. ClientId: ${!!clientId}, ClientSecret: ${!!clientSecret}`);
        }

        // 1) Exchange code for tokens
        console.log('=== RECRUITER STEP 1: Exchange code for tokens ===');
        const tokenResp = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }, { headers: { 'Content-Type': 'application/json' } });

        console.log('Google token response:', {
            status: tokenResp.status
        });

        const { access_token } = tokenResp.data || {};
        if (!access_token) throw new BadRequestException('Failed to obtain access token from Google');

        // 2) Fetch userinfo
        console.log('=== RECRUITER STEP 2: Fetch userinfo ===');
        const userinfoResp = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { email, name, picture, sub } = userinfoResp.data || {};
        console.log('Extracted userinfo:', { email, name, picture, sub });
        
        if (!email || !sub) throw new BadRequestException('Google userinfo missing email or sub');

        // 3) Find or create account with Recruiter role
        console.log('=== RECRUITER STEP 3: Find or create account ===');
        let account = await this.accountsRepo.findByEmail(email);
        console.log('Existing account found:', !!account);
        
        if (!account) {
            console.log('Creating new Google account for recruiter:', email);
            
            // Ensure 'Recruiter' role exists
            let recruiterRole: any = await this.rolesRepo.findByName('Recruiter');
            console.log('Recruiter role found:', !!recruiterRole);
            if (!recruiterRole) {
                console.log('Creating Recruiter role...');
                recruiterRole = await this.rolesRepo.create({ name: 'Recruiter', permissions: [] } as any);
                console.log('Recruiter role created:', recruiterRole);
            }

            // Create Account with Google provider
            console.log('Creating account with data:', {
                email,
                fullName: name || email.split('@')[0],
                provider: 'google',
                providerId: sub,
                isVerified: true
            });
            
            try {
                const createdAccount = await this.accountModel.create({
                    email,
                    fullName: name || email.split('@')[0],
                    password: '', // Empty for OAuth accounts
                    provider: 'google',
                    providerId: sub,
                    isVerified: true,
                    lastLoginAt: new Date(),
                });
                console.log('Account created successfully:', {
                    id: createdAccount._id,
                    email: createdAccount.email,
                    provider: createdAccount.provider
                });

                // Assign 'Recruiter' role to account
                try {
                    await this.accountRolesRepo.create({
                        accountId: new Types.ObjectId(String(createdAccount._id)),
                        roleId: new Types.ObjectId(String(recruiterRole._id)),
                    } as any);
                    console.log('Recruiter role assigned successfully');
                } catch (error) {
                    console.log('Role assignment failed:', error);
                }

                // Create Recruiter profile linked to Account
                try {
                    const recruiterProfile = await this.recruiterRepo.createEmpty(
                        String(createdAccount._id)
                    );
                    console.log('Recruiter profile created for account:', createdAccount._id);
                    
                    // Set Google profile picture as avatar if available
                    if (picture && recruiterProfile) {
                        try {
                            await this.recruiterRepo.setAvatarByAccountId(
                                String(createdAccount._id),
                                picture
                            );
                            console.log('Google avatar set for recruiter:', picture);
                        } catch (avatarError) {
                            console.log('Failed to set Google avatar:', avatarError);
                        }
                    }
                } catch (error) {
                    console.log('Recruiter profile creation failed:', error);
                }

                account = (await this.accountsRepo.findOne(String(createdAccount._id))) as any;
                
            } catch (error) {
                console.log('Account creation failed:', error);
                throw new BadRequestException('Failed to create Google account: ' + error.message);
            }
        } else {
            console.log('Existing account found:', email);
            
            // Check if account has Recruiter role
            const roles = await this.accountRolesRepo.findRolesByAccountId(new Types.ObjectId(String((account as any)._id)));
            const hasRecruiterRole = roles.includes('Recruiter');
            
            if (!hasRecruiterRole) {
                // Add Recruiter role if not present
                let recruiterRole: any = await this.rolesRepo.findByName('Recruiter');
                if (recruiterRole) {
                    try {
                        await this.accountRolesRepo.create({
                            accountId: new Types.ObjectId(String((account as any)._id)),
                            roleId: new Types.ObjectId(String(recruiterRole._id)),
                        } as any);
                        console.log('Recruiter role added to existing account');
                    } catch (error) {
                        console.log('Failed to add Recruiter role:', error);
                    }
                }
            }
            
            // Check if account needs Google provider info
            if (!(account as any).provider || (account as any).provider !== 'google') {
                console.log('Updating existing account with Google provider info...');
                try {
                    await this.accountsRepo.updateById(String((account as any)._id), {
                        provider: 'google',
                        providerId: sub,
                        isVerified: true,
                        lastLoginAt: new Date()
                    } as any);
                    console.log('Account updated with Google provider info');
                } catch (error) {
                    console.log('Failed to update account with Google info:', error);
                }
            } else {
                console.log('Account already has Google provider info');
                // Just update lastLoginAt
                try {
                    await this.accountsRepo.updateById(String((account as any)._id), {
                        lastLoginAt: new Date()
                    } as any);
                } catch (error) {
                    console.log('Failed to update lastLoginAt:', error);
                }
            }
            
            // Ensure Recruiter profile exists
            try {
                const existingRecruiter = await this.recruiterRepo.get(String((account as any)._id));
                if (!existingRecruiter) {
                    await this.recruiterRepo.createEmpty(String((account as any)._id));
                    console.log('Recruiter profile created for existing account:', (account as any)._id);
                    
                    // Set Google profile picture as avatar if available
                    if (picture) {
                        try {
                            await this.recruiterRepo.setAvatarByAccountId(
                                String((account as any)._id),
                                picture
                            );
                            console.log('Google avatar set for recruiter:', picture);
                        } catch (avatarError) {
                            console.log('Failed to set Google avatar:', avatarError);
                        }
                    }
                } else {
                    console.log('Recruiter profile already exists');
                    
                    // Update avatar if Google picture is available and recruiter doesn't have avatar
                    if (picture && !existingRecruiter.avatar) {
                        try {
                            await this.recruiterRepo.setAvatarByAccountId(
                                String((account as any)._id),
                                picture
                            );
                            console.log('Google avatar updated for existing recruiter:', picture);
                        } catch (avatarError) {
                            console.log('Failed to update Google avatar:', avatarError);
                        }
                    }
                }
            } catch (error) {
                console.log('Recruiter profile creation/check failed:', error);
            }
        }

        // 4) Build JWT and set cookie
        const roles = await this.accountRolesRepo.findRolesByAccountId(new Types.ObjectId(String((account as any)._id)));
        const payload = {
            sub: String((account as any)._id),
            email: (account as any).email,
            roles,
        };
        const token = this.jwtService.sign(payload);

        res.cookie('tokenRecruiter', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 1000 * 60 * 60, // 1h
        });

        // 5) Redirect to Recruiter FE
        const feUrl = process.env.FRONTEND_RECRUITER_URL || 'http://localhost:5173';
        return res.redirect(`${feUrl}/login?oauth=success`);
    }

    @ApiResponse({ status: 400, description: 'Invalid registration data' })
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