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
      passReqToCallback: false,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // El objeto que retornamos aquí se inyectará en el objeto `request` de Express.
    // Podremos acceder a él como `req.user` en nuestros controladores.
    return user;
  }
}
