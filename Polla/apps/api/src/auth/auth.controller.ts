import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, VerifyEmailDto, ResetPasswordDto, ResendVerificationCodeDto } from './dto/auth.dto';
import { User } from '../database/entities/user.entity';
import { MailService } from '../mail/mail.service';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) { }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {
    // Inicia el flujo, Passport se encarga de la redirección a Google
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: { user: User }, @Res() res: Response) {
    const token = await this.authService.googleLogin(req.user);

    // Limpiar cualquier cookie de sesión anterior
    res.clearCookie('connect.sid');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    console.log('🔄 Redirigiendo a frontend:', `${frontendUrl}/auth/success`);
    return res.redirect(`${frontendUrl}/auth/success?token=${token.access_token}`);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto, @Req() req: { user: User }) {
    // El AuthGuard('local') ya validó las credenciales usando LocalStrategy
    // y puso el usuario en req.user.
    // Usamos loginDto solo para validación de entrada/Swagger.
    return this.authService.login(req.user);
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
      console.log(`❌ [GET /auth/profile] Usuario NO encontrado en BD con ID: ${req.user.id}`);
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
  async logout(@Res() res: Response) {
    // Limpiar cookies si las hubiera
    res.clearCookie('connect.sid');
    res.clearCookie('token');

    return res.json({
      message: 'Logout successful',
      success: true
    });
  }

  @Get('debug/mail')
  async debugMail(@Req() req: any) {
    const testEmail = 'racv85@hotmail.com';
    console.log(`🧪 [Debug] Testing email to: ${testEmail}`);
    
    // Direct call to MailService bypasses user checks
    const result = await this.mailService.sendVerificationEmail(testEmail, '123456');
    
    return {
      status: 'Diagnostic check complete',
      mail_response: result,
      smtp_config: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 465,
        user: (process.env.SMTP_USER || process.env.SMTP_user) ? '✅ set' : '❌ missing',
        secure: process.env.SMTP_SECURE
      }
    };
  }
}
