import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu API không gắn @Roles, cho phép đi qua
    if (!requiredRoles) {
      return true;
    }
    // Lấy user từ request
    const { user } = context.switchToHttp().getRequest();
    // Check roles
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(this.i18n.t('auth.cannot_access'));
    }

    return true;
  }
}
