import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, VerifyEmailDto } from './dto/auth.dto';
import { User } from '../database/entities/user.entity';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
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

    return res.redirect(`http://localhost:3001/auth/success?token=${token.access_token}`);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
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
}
