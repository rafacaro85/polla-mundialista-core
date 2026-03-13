import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';

// Extractor personalizado: primero cookie httpOnly, luego Bearer header (fallback para Postman/mobile)
const cookieExtractor = (req: Request): string | null => {
  if (req?.cookies?.auth_token) {
    return req.cookies.auth_token;
  }
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      console.error('❌❌❌ CRITICAL ERROR: JWT_SECRET NOT FOUND IN ENVIRONMENT VARIABLES ❌❌❌');
      console.error('The application will use a fallback secret for now, but ALL TOKENS WILL BE INVALID.');
      console.error('PLEASE SET JWT_SECRET IN YOUR RAILWAY DASHBOARD IMMEDIATELY.');
    }

    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: secret || 'temporary_unsafe_fallback_secret_change_immediately',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Lógica global de Impersonation para SUPER_ADMIN
    const impersonateUserId = req.headers['x-impersonate-user'] as string;
    if (impersonateUserId && user.role === 'SUPER_ADMIN') {
      const impersonatedUser = await this.usersService.findById(impersonateUserId);
      if (impersonatedUser) {
        // Marcamos que la petición está siendo suplantada para posible auditoría futura
        (impersonatedUser as any).isImpersonated = true;
        (impersonatedUser as any).impersonatorId = user.id;
        return impersonatedUser;
      }
    }

    return user;
  }
}
