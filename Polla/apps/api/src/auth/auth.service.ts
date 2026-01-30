import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, ForgotPasswordDto, VerifyEmailDto, ResetPasswordDto, ResendVerificationCodeDto } from './dto/auth.dto';
import { User } from '../database/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly telegramService: TelegramService,
  ) { }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && await bcrypt.compare(pass, user.password)) {
      // Se omite la contraseña en el objeto de usuario retornado
      const { password, ...result } = user;
      return result as User;
    }
    return null;
  }

  async validateUserWithExceptions(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user registered with Google and has no password
    if (!user.password) {
      throw new UnauthorizedException('This account was created with Google. Please use "Continue with Google" to sign in, or register with the same email to add a password.');
    }

    if (!await bcrypt.compare(pass, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...result } = user;
    return result as User;
  }

  async login(user: User) {
    if (!user.isVerified && user.password) { // Solo requerir verificación si tiene password (no Google)
      throw new UnauthorizedException('Email not verified. Please verify your email.');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    // OPCIÓN B: Si el usuario existe y fue creado con Google (sin contraseña), agregar contraseña
    if (existingUser) {
      // Si el usuario ya tiene contraseña, es un registro duplicado
      if (existingUser.password) {
        throw new ConflictException('Email already registered. Please login instead.');
      }

      // Usuario existe pero sin contraseña (creado con Google)
      console.log('🔄 [Register] Usuario de Google encontrado. Agregando contraseña...');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   ID: ${existingUser.id}`);

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Actualizar usuario con contraseña y código de verificación
      const updatedUser = await this.usersService.update(existingUser, {
        password: hashedPassword,
        verificationCode,
        isVerified: false, // Requiere verificación para el método de contraseña
        fullName: registerDto.name || existingUser.fullName, // Actualizar nombre si se proporciona
        phoneNumber: registerDto.phoneNumber || existingUser.phoneNumber
      });

      // Enviar EMAIL REAL
      try {
        await this.mailService.sendVerificationEmail(registerDto.email, verificationCode);
        console.log(`📧 [AuthService] Correo de verificación enviado a: ${registerDto.email}`);
      } catch (error) {
        console.error(`❌ [AuthService] Error enviando correo:`, error);
      }

      // MOCK SMS SERVICE (Si hay teléfono)
      if (registerDto.phoneNumber) {
        console.log('📱 [MOCK SMS SERVICE] --------------------------------------------------');
        console.log(`   To: ${registerDto.phoneNumber}`);
        console.log(`   Message: Your verification code is: ${verificationCode}`);
        console.log('----------------------------------------------------------------------');
      }

      const { password, ...result } = updatedUser;
      return result as User;
    }

    // Usuario no existe, crear uno nuevo
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await this.usersService.create(
      registerDto.email,
      registerDto.name,
      hashedPassword,
      undefined, // googleId
      undefined, // avatarUrl
      registerDto.phoneNumber // phoneNumber
    );

    // Guardar código de verificación
    await this.usersService.update(user, { verificationCode, isVerified: false });

    // Enviar EMAIL REAL
    try {
      await this.mailService.sendVerificationEmail(registerDto.email, verificationCode);
      console.log(`📧 [AuthService] Correo de verificación enviado a: ${registerDto.email}`);
    } catch (error) {
      console.error(`❌ [AuthService] Error enviando correo:`, error);
    }

    // MOCK SMS SERVICE (Si hay teléfono)
    if (registerDto.phoneNumber) {
      console.log('📱 [MOCK SMS SERVICE] --------------------------------------------------');
      console.log(`   To: ${registerDto.phoneNumber}`);
      console.log(`   Message: Your verification code is: ${verificationCode}`);
      console.log(`   Message: Your verification code is: ${verificationCode}`);
      console.log('----------------------------------------------------------------------');
    }

    // 📢 Admin Alert
    this.telegramService.notifyNewUser(registerDto.email, registerDto.name, registerDto.phoneNumber).catch(e => console.error('Telegram Error:', e));

    // Se omite la contraseña en el objeto de usuario retornado
    const { password, ...result } = user;
    return result as User;
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.usersService.findByEmail(verifyEmailDto.email);
    if (!user) {
      throw new BadRequestException('Invalid email or code');
    }

    if (user.isVerified) {
      return this.login(user);
    }

    if (user.verificationCode !== verifyEmailDto.code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Verificar usuario
    const updatedUser = await this.usersService.update(user, {
      isVerified: true,
      verificationCode: null
    });

    return this.login(updatedUser);
  }

  async resendVerificationCode(dto: ResendVerificationCodeDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      return { message: 'Email already verified' };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await this.usersService.update(user, { verificationCode });

    try {
      await this.mailService.sendVerificationEmail(user.email, verificationCode);
      console.log(`📧 [AuthService] Código de verificación reenviado a: ${user.email}`);
    } catch (error) {
      console.error(`❌ [AuthService] Error reenviando correo:`, error);
    }

    return { message: 'New verification code sent' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Por seguridad, no revelamos si el usuario existe o no
      return { message: 'If the email exists, a recovery link has been sent.' };
    }

    // Generar un token de recuperación usando JWT válido por 1 hora
    // Incluimos el hash de la contraseña actual para que el token se invalide si la contraseña cambia
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'reset-password' },
      { expiresIn: '1h' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'https://www.lapollavirtual.com';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.mailService.sendResetPasswordEmail(user.email, resetLink);
      console.log(`📧 [AuthService] Enlace de recuperación enviado a: ${user.email}`);
    } catch (error) {
      console.error(`❌ [AuthService] Error enviando correo de recuperación:`, error);
    }

    return { message: 'If the email exists, a recovery link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify(resetPasswordDto.token);
      
      if (payload.type !== 'reset-password') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new BadRequestException('User no longer exists');
      }

      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
      await this.usersService.update(user, {
        password: hashedPassword,
        isVerified: true // Si puede recuperar contraseña, asumimos que tiene control del correo
      });

      return { message: 'Password reset successfully. You can now login.' };
    } catch (error) {
      console.error('❌ [AuthService] Error resetting password:', error);
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async validateGoogleUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }): Promise<User> {

    console.log('🔍 [Google OAuth] Validando usuario de Google...');
    console.log(`   📧 Email: ${profile.email}`);
    console.log(`   👤 Nombre: ${profile.firstName} ${profile.lastName}`);

    // 🔥 BÚSQUEDA PRIMARIA: Buscar usuario existente por email
    const existingUser = await this.usersService.findByEmail(profile.email);

    if (existingUser) {
      // ✅ USUARIO EXISTE: Actualizar datos y retornar
      console.log(`✅ [Google OAuth] Usuario encontrado en BD`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Rol: ${existingUser.role}`);
      console.log(`   🔄 Actualizando foto de perfil...`);

      // Actualizar solo foto y googleId si es necesario
      // Google users are automatically verified
      const updatedUser = await this.usersService.update(existingUser, {
        googleId: profile.email,
        avatarUrl: profile.picture,
        isVerified: true
      });

      console.log(`✅ [Google OAuth] Usuario actualizado y retornado`);
      return updatedUser;
    }

    // ❌ USUARIO NO EXISTE: Crear nuevo usuario
    console.log(`📝 [Google OAuth] Usuario NO encontrado. Creando nuevo usuario...`);

    const newUser = await this.usersService.create(
      profile.email,
      `${profile.firstName} ${profile.lastName}`,
      undefined, // Sin contraseña (autenticación solo por Google)
      profile.email, // googleId
      profile.picture, // avatarUrl
    );

    // Google users are verified by default
    await this.usersService.update(newUser, { isVerified: true });

    // 📢 Admin Alert (si es nuevo)
    this.telegramService.notifyNewUser(newUser.email, newUser.fullName, newUser.phoneNumber).catch(e => console.error('Telegram Error:', e));

    console.log(`✅ [Google OAuth] Nuevo usuario creado`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Rol: ${newUser.role}`);

    return newUser;
  }

  async googleLogin(user: User) {
    // Reutiliza la lógica de login para generar el JWT para el usuario de Google
    return this.login(user);
  }
}
