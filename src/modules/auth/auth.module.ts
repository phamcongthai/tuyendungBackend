import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from '../accounts/account.module';
import { UsersModule } from '../users/users.module';
import { AccountRolesModule } from '../account_roles/account_roles.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies.ts/jwt.strategy';
import { EmailVerification, EmailVerificationDocument, EmailVerificationSchema } from './schemas/email_verifications.schema';

@Module({
  imports: [
    AccountsModule,
    UsersModule,
    AccountRolesModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'donthackmepls!',
      signOptions: { expiresIn: '1h' , algorithm: 'HS256'},
    }),
    MongooseModule.forFeature([{ name: EmailVerification.name, schema: EmailVerificationSchema }])
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy],
  exports: [AuthService, AuthRepository, JwtStrategy],
})
export class AuthModule {}
