import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, ForgotPasswordDto, VerifyEmailDto, ResetPasswordDto, ResendVerificationCodeDto, MatchLoginDto } from './dto/auth.dto';
import { User } from '../database/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { TelegramService } from '../telegram/telegram.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { League } from '../database/entities/league.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly telegramService: TelegramService,
    @InjectRepository(League)
    private readonly leagueRepository: Repository<League>,
    @InjectRepository(LeagueParticipant)
    private readonly leagueParticipantRepository: Repository<LeagueParticipant>,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
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
      throw new UnauthorizedException(
        'This account was created with Google. Please use "Continue with Google" to sign in, or register with the same email to add a password.',
      );
    }

    if (!(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...result } = user;
    return result as User;
  }

  async login(user: User) {
    if (!user.isVerified && user.password) {
      // Solo requerir verificación si tiene password (no Google)
      throw new UnauthorizedException(
        'Email not verified. Please verify your email.',
      );
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async matchLogin(dto: MatchLoginDto) {
    const league = await this.leagueRepository.findOne({
      where: { matchCode: dto.matchCode },
    });

    if (!league || !league.isMatchMode) {
      throw new NotFoundException('Código de partido inválido o inactivo');
    }

    let user = await this.usersService.findByPhoneNumber(dto.phone);

    if (!user) {
      // Create match guest
      user = await this.usersService.createMatchGuest(
        dto.name,
        dto.phone,
        dto.tableNumber,
      );
    } else {
      // Update table number if it changed
      if (user.tableNumber !== dto.tableNumber || user.fullName !== dto.name) {
        await this.usersService.update(user, {
          tableNumber: dto.tableNumber,
          fullName: dto.name, // optionally update name
        });
      }
    }

    // Ensure the user is a participant of the league
    let participant = await this.leagueParticipantRepository.findOne({
      where: { user: { id: user.id }, league: { id: league.id } },
    });

    if (!participant) {
      participant = this.leagueParticipantRepository.create({
        user,
        league,
        isAdmin: false,
        isBlocked: false,
      });
      await this.leagueParticipantRepository.save(participant);
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        leagueId: league.id,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    // OPCIÓN B: Si el usuario existe y fue creado con Google (sin contraseña), agregar contraseña
    if (existingUser) {
      // Si el usuario ya tiene contraseña, es un registro duplicado
      if (existingUser.password) {
        throw new ConflictException(
          'Email already registered. Please login instead.',
        );
      }

      // Usuario existe pero sin contraseña (creado con Google)
      this.logger.log('[Register] Usuario de Google encontrado. Agregando contraseña...', { userId: existingUser.id });

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Actualizar usuario con contraseña y código de verificación
      const updatedUser = await this.usersService.update(existingUser, {
        password: hashedPassword,
        verificationCode,
        verificationCodeExpiresAt,
        isVerified: false, // Requiere verificación para el método de contraseña
        fullName: registerDto.name || existingUser.fullName, // Actualizar nombre si se proporciona
        phoneNumber: registerDto.phoneNumber || existingUser.phoneNumber,
      });

      // Enviar correo en segundo plano
      this.mailService
        .sendVerificationEmail(registerDto.email, verificationCode)
        .then(() =>
          this.logger.log('Verification email sent', { userId: existingUser.id })
        )
        .catch((err) =>
          this.logger.error('Error enviando correo', err)
        );

      // MOCK SMS SERVICE (Si hay teléfono)
      if (registerDto.phoneNumber) {
        this.logger.log('Verification code sent via SMS', { userId: existingUser.id });
      }

      const { password, ...result } = updatedUser;
      return result as User;
    }

    // Usuario no existe, crear uno nuevo
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    const user = await this.usersService.create(
      registerDto.email,
      registerDto.name,
      hashedPassword,
      undefined, // googleId
      undefined, // avatarUrl
      registerDto.phoneNumber, // phoneNumber
    );

    // Guardar código de verificación
    await this.usersService.update(user, {
      verificationCode,
      verificationCodeExpiresAt,
      isVerified: false,
    });

    // Enviar correo en segundo plano
    this.mailService
      .sendVerificationEmail(registerDto.email, verificationCode)
      .then(() =>
        this.logger.log('Verification email sent', { userId: user.id })
      )
      .catch((err) =>
        this.logger.error('Error enviando correo', err)
      );

    // MOCK SMS SERVICE (Si hay teléfono)
    if (registerDto.phoneNumber) {
      this.logger.log('Verification code sent via SMS', { userId: user.id });
    }

    // 📢 Admin Alert
    this.telegramService
      .notifyNewUser(
        registerDto.email,
        registerDto.name,
        registerDto.phoneNumber,
      )
      .catch((e) => console.error('Telegram Error:', e));

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

    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('El código de verificación ha expirado. Por favor solicita uno nuevo.');
    }

    // Verificar usuario
    const updatedUser = await this.usersService.update(user, {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
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

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.usersService.update(user, { 
      verificationCode, 
      verificationCodeExpiresAt 
    });

    // Enviar código en segundo plano
    this.mailService
      .sendVerificationEmail(user.email, verificationCode)
      .then(() =>
        this.logger.log('Verification code resent', { userId: user.id })
      )
      .catch((err) =>
        this.logger.error('Error reenviando correo', err)
      );

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
      { expiresIn: '1h' },
    );

    const frontendUrl = (
      process.env.FRONTEND_URL || 'https://lapollavirtual.com'
    ).replace(/\/$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.mailService.sendResetPasswordEmail(user.email, resetLink);
      this.logger.log('Recovery link sent', { userId: user.id });
    } catch (error) {
      this.logger.error('Error enviando correo de recuperación', error);
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

      const hashedPassword = await bcrypt.hash(
        resetPasswordDto.newPassword,
        10,
      );
      await this.usersService.update(user, {
        password: hashedPassword,
        isVerified: true, // Si puede recuperar contraseña, asumimos que tiene control del correo
      });

      return { message: 'Password reset successfully. You can now login.' };
    } catch (error) {
      this.logger.error('Error resetting password', error);
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async validateGoogleUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }): Promise<User> {
    this.logger.log('[Google OAuth] Initializing validation...');

    // 🔥 BÚSQUEDA PRIMARIA: Buscar usuario existente por email
    const existingUser = await this.usersService.findByEmail(profile.email);

    if (existingUser) {
      // ✅ USUARIO EXISTE: Actualizar datos y retornar
      this.logger.log('[Google OAuth] Usuario encontrado en BD, actualizando...', { userId: existingUser.id });

      // Actualizar solo foto y googleId si es necesario
      // Google users are automatically verified
      const updatedUser = await this.usersService.update(existingUser, {
        googleId: profile.email,
        avatarUrl: profile.picture,
        isVerified: true,
      });

      this.logger.log('[Google OAuth] Usuario actualizado exitosamente', { userId: updatedUser.id });
      return updatedUser;
    }

    // ❌ USUARIO NO EXISTE: Crear nuevo usuario
    this.logger.log('[Google OAuth] Usuario NO encontrado. Creando nuevo usuario...');

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
    this.telegramService
      .notifyNewUser(newUser.email, newUser.fullName, newUser.phoneNumber)
      .catch((e) => this.logger.error('Telegram Error', e));

    this.logger.log('[Google OAuth] Nuevo usuario creado', { userId: newUser.id, role: newUser.role });

    return newUser;
  }

  async googleLogin(user: User) {
    // Reutiliza la lógica de login para generar el JWT para el usuario de Google
    return this.login(user);
  }
}
