import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không có yêu cầu role thì cho phép truy cập
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Kiểm tra user có tồn tại không (should be checked by JWT guard first)
    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'User information not found in request',
        error: 'Forbidden',
        timestamp: new Date().toISOString(),
      });
    }

    // Kiểm tra user có roles không
    if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
      throw new ForbiddenException({
        statusCode: 403,
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}. User has no roles assigned.`,
        error: 'Forbidden',
        timestamp: new Date().toISOString(),
        requiredRoles,
        userRoles: [],
      });
    }

    // Kiểm tra user có ít nhất 1 role nằm trong requiredRoles không
    const hasRequiredRole = user.roles.some((role: string) => requiredRoles.includes(role));
    
    if (!hasRequiredRole) {
      throw new ForbiddenException({
        statusCode: 403,
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}. User roles: ${user.roles.join(', ')}.`,
        error: 'Forbidden',
        timestamp: new Date().toISOString(),
        requiredRoles,
        userRoles: user.roles,
      });
    }

    return true;
  }
}
