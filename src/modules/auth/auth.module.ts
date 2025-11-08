import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from '../accounts/account.module';
import { UsersModule } from '../users/users.module';
import { AccountRolesModule } from '../account_roles/account_roles.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies.ts/jwt.strategy';
import { EmailVerification, EmailVerificationDocument, EmailVerificationSchema } from './schemas/email_verifications.schema';
import { RolesModule } from '../roles/roles.module';
import { Account, AccountSchema } from '../accounts/schema/account.schema';

@Module({
  imports: [
    AccountsModule,
    UsersModule,
    AccountRolesModule,
    RolesModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'donthackmepls!',
      signOptions: { expiresIn: '1h' , algorithm: 'HS256'},
    }),
    MongooseModule.forFeature([
      { name: EmailVerification.name, schema: EmailVerificationSchema },
      { name: Account.name, schema: AccountSchema }
    ])
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
