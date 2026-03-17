import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_SECRET');

    if (!clientID || !clientSecret) {
      console.error('❌❌❌ CRITICAL: GOOGLE_CLIENT_ID or GOOGLE_SECRET not found! ❌❌❌');
    }

    super({
      clientID: clientID || 'missing_client_id',
      clientSecret: clientSecret || 'missing_client_secret',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'https://api.lapollavirtual.com/api/auth/google/redirect',
      scope: ['email', 'profile'],
      authorizationParams: {
        prompt: 'select_account',
      },
    } as any);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;
      const googleUser = {
        email: emails && emails.length > 0 ? emails[0].value : null,
        firstName: name?.givenName || 'Google',
        lastName: name?.familyName || 'User',
        picture: photos && photos.length > 0 ? photos[0].value : null,
        accessToken,
      };

      if (!googleUser.email) {
        throw new Error('No email found in Google Profile');
      }

      // La lógica de buscar o crear al usuario se delega al AuthService
      const user = await this.authService.validateGoogleUser(googleUser);
      done(null, user);
    } catch (error) {
      console.error('❌ [GoogleStrategy] Error durante validación:', error);
      done(error, null);
    }
  }
}
