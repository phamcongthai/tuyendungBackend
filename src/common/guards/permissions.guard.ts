import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách permissions yêu cầu từ decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu route không yêu cầu permission thì cho qua
    if (!requiredPermissions) return true;

    const { user } = context.switchToHttp().getRequest();

    // Kiểm tra user có đủ tất cả permissions không
    return requiredPermissions.every((p) => user.permissions?.includes(p));
  }
}
