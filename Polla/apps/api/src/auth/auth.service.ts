import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, ForgotPasswordDto, VerifyEmailDto } from './dto/auth.dto';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
      throw new UnauthorizedException('This account was created with Google. Please use "Continue with Google" to sign in.');
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
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

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

    // MOCK EMAIL SERVICE
    console.log('📧 [MOCK EMAIL SERVICE] ------------------------------------------------');
    console.log(`   To: ${registerDto.email}`);
    console.log(`   Subject: Verify your email`);
    console.log(`   Code: ${verificationCode}`);
    console.log('----------------------------------------------------------------------');

    // MOCK SMS SERVICE (Si hay teléfono)
    if (registerDto.phoneNumber) {
      console.log('📱 [MOCK SMS SERVICE] --------------------------------------------------');
      console.log(`   To: ${registerDto.phoneNumber}`);
      console.log(`   Message: Your verification code is: ${verificationCode}`);
      console.log('----------------------------------------------------------------------');
    }

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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Por seguridad, no revelamos si el usuario existe o no
      return { message: 'If the email exists, a recovery link has been sent.' };
    }

    // Simulación de generación de token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log(`🔗 [Recovery Link] http://localhost:3000/reset-password?token=${token}`);

    return { message: 'If the email exists, a recovery link has been sent.' };
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
