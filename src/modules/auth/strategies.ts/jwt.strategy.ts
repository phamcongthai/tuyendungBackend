import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { AccountsRepository } from '../../accounts/repositories/accounts.repository';
import { AccountRolesRepository } from '../../account_roles/repositories/account_roles.repository';
import { Types } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly accountsRepo: AccountsRepository,
    private readonly accountRolesRepo: AccountRolesRepository,
  ) {
    super({
      jwtFromRequest: (req) => req?.cookies?.['token'] || null,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'donthackmepls!',
    });
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    const user = await this.accountsRepo.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const accountId = new Types.ObjectId(payload.sub);
    const currentRoles = await this.accountRolesRepo.findRolesByAccountId(accountId);

    const validatedUser = {
      id: payload.sub,
      email: payload.email,
      roles: currentRoles,
      fullName: user.fullName,
      phone: user.phone,
      isVerified: user.isVerified,
    };
    
    return validatedUser;
  }
}
