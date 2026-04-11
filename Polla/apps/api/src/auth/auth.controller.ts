import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyEmailDto,
  ResetPasswordDto,
  ResendVerificationCodeDto,
  MatchLoginDto,
} from './dto/auth.dto';
import { User } from '../database/entities/user.entity';
import { MailService } from '../mail/mail.service';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

// Opciones de cookie compartidas para consistencia
const COOKIE_OPTIONS = (isProduction: boolean) => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  maxAge: 24 * 60 * 60 * 1000, // 1 día en ms
  path: '/',
});

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req: any) {
    // GoogleAuthGuard inyecta el parámetro 'redirect' como 'state' en la URL de Google.
    // Google nos devuelve ese state intacto en el callback.
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
      const { access_token } = await this.authService.googleLogin(req.user);
      const isProduction = process.env.NODE_ENV === 'production';

      // Limpiar cookie de sesión de OAuth y setear token como httpOnly
      res.clearCookie('connect.sid');
      // Cookie del backend (funciona para same-domain, fallback)
      res.cookie('auth_token', access_token, COOKIE_OPTIONS(isProduction));

      // --- LÓGICA DE REDIRECCIÓN DINÁMICA (SECURE) ---
      // Prioridad: 1) state de Google (inyectado por GoogleAuthGuard)
      //            2) FRONTEND_URL como último recurso
      const stateParam = req.query?.state;
      const defaultFrontend = process.env.FRONTEND_URL || 'http://localhost:3001';
      
      const WHITELIST = [
        'https://lapollavirtual.com',
        'https://www.lapollavirtual.com',
        'https://match.lapollavirtual.com',
        'http://localhost:3000',
        'http://localhost:3001',
      ];

      let candidateOrigin = stateParam || '';
      if (!candidateOrigin || !WHITELIST.some(d => candidateOrigin.startsWith(d))) {
        candidateOrigin = '';
      }

      const isValidOrigin = candidateOrigin && WHITELIST.some(domain => candidateOrigin.startsWith(domain));
      const finalRedirectUrl = isValidOrigin ? candidateOrigin : defaultFrontend;

      // Pasar JWT en URL para resolver cookies cross-domain (Chrome 120+)
      // El frontend leerá este token y creará la cookie en su propio dominio
      console.log('🔄 [OAuth Redirect] state:', stateParam);
      console.log('🔄 [OAuth Redirect] finalRedirectUrl:', finalRedirectUrl);
      return res.redirect(`${finalRedirectUrl}/auth/success?token=${access_token}`);
    } catch (error) {
      console.error('❌ [AuthController Google Redirect] Error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/auth/error?message=GoogleLoginFailed`);
    }
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: { user: User },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, user } = await this.authService.login(req.user);
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', access_token, COOKIE_OPTIONS(isProduction));
    // El token NUNCA se retorna en el body
    return { user };
  }

  @Post('match-login')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async matchLogin(
    @Body() loginDto: MatchLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, user } = await this.authService.matchLogin(loginDto);
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', access_token, COOKIE_OPTIONS(isProduction));
    return { user };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('verify')
  async verify(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: ResendVerificationCodeDto) {
    return this.authService.resendVerificationCode(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req: { user: User }) {
    console.log('🔍 [GET /auth/profile] Consultando perfil...');
    console.log(`   ID del JWT: ${req.user.id}`);
    console.log(`   Email del JWT: ${req.user.email}`);

    // 🔥 CRÍTICO: Consultar base de datos para obtener datos frescos (Single Source of Truth)
    const freshUser = await this.usersService.findById(req.user.id);

    if (!freshUser) {
      console.log(
        `❌ [GET /auth/profile] Usuario NO encontrado en BD con ID: ${req.user.id}`,
      );
      console.log(`   Buscando por email: ${req.user.email}`);

      // Intentar buscar por email como fallback
      const userByEmail = await this.usersService.findByEmail(req.user.email);
      if (userByEmail) {
        console.log(`✅ [GET /auth/profile] Usuario encontrado por email`);
        const { password, ...userWithoutPassword } = userByEmail;
        return userWithoutPassword;
      }

      throw new Error('User not found');
    }

    console.log(`✅ [GET /auth/profile] Usuario encontrado`);
    const { password, ...userWithoutPassword } = freshUser;
    return userWithoutPassword;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    // Limpiar TODAS las cookies de autenticación
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    res.clearCookie('connect.sid');
    return { message: 'Sesión cerrada correctamente', success: true };
  }

  @Get('debug/mail')
  async debugMail(@Req() req: any) {
    const testEmail = 'racv85@hotmail.com';
    console.log(`🧪 [Debug] Testing email to: ${testEmail}`);

    try {
      // Direct call to MailService bypasses user checks
      const result = await this.mailService.sendVerificationEmail(
        testEmail,
        '123456',
      );

      return {
        status: 'Diagnostic check complete',
        mail_response: result,
        smtp_config: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 465,
          user:
            process.env.SMTP_USER || process.env.SMTP_user
              ? '✅ set'
              : '❌ missing',
          secure: process.env.SMTP_SECURE,
        },
      };
    } catch (e) {
      return {
        status: 'Error in diagnostic',
        error: e.message,
      };
    }
  }

  @Get('diag/network')
  async diagNetwork() {
    const net = require('net');
    const targets = [
      { host: 'smtp.gmail.com', port: 465 },
      { host: 'smtp.gmail.com', port: 587 },
      { host: 'google.com', port: 80 },
    ];

    const results = [];
    for (const t of targets) {
      const start = Date.now();
      const connected = await new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
        socket.on('error', () => {
          socket.destroy();
          resolve(false);
        });
        socket.connect(t.port, t.host);
      });
      results.push({
        ...t,
        success: connected,
        time: `${Date.now() - start}ms`,
      });
    }
    return results;
  }
}
