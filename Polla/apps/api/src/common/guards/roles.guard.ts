import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
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

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Permitir tanto ADMIN como SUPER_ADMIN
    const hasRole = requiredRoles.some((role) => {
      if (role === 'ADMIN') {
        return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      }
      return user.role === role;
    });

    if (!hasRole) {
      throw new ForbiddenException(
        'Insufficient permissions. Admin access required.',
      );
    }

    return true;
  }
}
