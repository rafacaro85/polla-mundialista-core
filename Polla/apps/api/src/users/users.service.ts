import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { UserRole } from '../database/enums/user-role.enum';

import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { ConflictException } from '@nestjs/common';

import { Prediction } from '../database/entities/prediction.entity';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { AccessCode } from '../database/entities/access-code.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { AccessCodeStatus } from '../database/enums/access-code-status.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(League)
    private readonly leagueRepository: Repository<League>,
    @InjectRepository(LeagueParticipant)
    private readonly leagueParticipantRepository: Repository<LeagueParticipant>,
    @InjectRepository(Prediction)
    private readonly predictionRepository: Repository<Prediction>,
    @InjectRepository(UserBracket)
    private readonly userBracketRepository: Repository<UserBracket>,
    @InjectRepository(AccessCode)
    private readonly accessCodeRepository: Repository<AccessCode>,
    @InjectRepository(UserBonusAnswer)
    private readonly userBonusAnswerRepository: Repository<UserBonusAnswer>,
  ) {}

  async getUserDetails(userId: string) {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      const participants = await this.leagueParticipantRepository.find({
        where: { user: { id: userId } },
        relations: ['league'],
      });

      const leaguesData = await Promise.all(
        participants.map(async (p) => {
          if (!p.league) return null; // Safety check
          const leagueId = p.league.id;

          // Fetch predictions for SPECIFIC league
          const predictions = await this.predictionRepository.find({
            where: { user: { id: userId }, leagueId: leagueId },
          });
          const predictionPoints = predictions.reduce(
            (sum, pred) => sum + (pred.points ?? 0),
            0,
          );
          const jokerPoints = predictions
            .filter((pred) => pred.isJoker)
            .reduce((sum, pred) => sum + (pred.points ?? 0), 0);

          const bracket = await this.userBracketRepository.findOne({
            where: { userId: userId, leagueId: leagueId },
          });
          const bracketPoints = bracket ? (bracket.points ?? 0) : 0;

          // Determine final points (Manual override takes precedence if set in DB)
          const finalPredictionPoints =
            p.predictionPoints !== null && p.predictionPoints !== undefined
              ? p.predictionPoints
              : predictionPoints;
          const finalBracketPoints =
            p.bracketPoints !== null && p.bracketPoints !== undefined
              ? p.bracketPoints
              : bracketPoints;
          const finalJokerPoints =
            p.jokerPoints !== null && p.jokerPoints !== undefined
              ? p.jokerPoints
              : jokerPoints;

          return {
            leagueId: p.league.id,
            leagueName: p.league.name,
            leagueCode: p.league.accessCodePrefix,
            isBlocked: p.isBlocked,
            stats: {
              totalPoints: p.totalPoints ?? 0,
              predictionPoints: finalPredictionPoints,
              triviaPoints: p.triviaPoints ?? 0,
              bracketPoints: finalBracketPoints,
              jokerPoints: finalJokerPoints,
            },
          };
        }),
      );

      // Filter out nulls if any league was missing
      const validLeaguesData = leaguesData.filter(l => l !== null);

      // GLOBAL STATS (To catch points from predictions without leagueId or across all leagues)
      const allPredictions = await this.predictionRepository.find({
        where: { user: { id: userId } },
      });
      const globalPredictionPoints = allPredictions.reduce(
        (sum, p) => sum + (p.points ?? 0),
        0,
      );
      const globalJokerPoints = allPredictions
        .filter((p) => p.isJoker)
        .reduce((sum, p) => sum + (p.points ?? 0), 0);

      const allBrackets = await this.userBracketRepository.find({
        where: { userId: userId },
      });
      const globalBracketPoints = allBrackets.reduce(
        (sum, b) => sum + (b.points ?? 0),
        0,
      );

      const globalTriviaPoints = participants.reduce(
        (sum, p) => sum + (p.triviaPoints ?? 0),
        0,
      );
      const globalTotalPoints =
        globalPredictionPoints + globalBracketPoints + globalTriviaPoints;

      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          createdAt: user.createdAt,
          nickname: user.nickname,
        },
        globalStats: {
          totalPoints: globalTotalPoints,
          predictionPoints: globalPredictionPoints,
          jokerPoints: globalJokerPoints,
          bracketPoints: globalBracketPoints,
          triviaPoints: globalTriviaPoints,
        },
        leagues: validLeaguesData,
      };
    } catch (error) {
      console.error(`❌ Error fetching user details for ${userId}:`, error);
      throw error; // Re-throw to let controller handle it, but now we have a log
    }
  }

  async createAdmin(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : await bcrypt.hash('polla123', 10); // Password por defecto si no se da

    const newUser = this.usersRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      nickname: dto.nickname,
      password: hashedPassword,
      role: dto.role || UserRole.PLAYER,
      isVerified: true, // Admin created users are verified
      isBanned: false,
    });

    const savedUser = await this.usersRepository.save(newUser);

    // Asignar a liga si se especificó
    if (dto.leagueId) {
      const league = await this.leagueRepository.findOne({
        where: { id: dto.leagueId },
      });
      if (league) {
        const participant = this.leagueParticipantRepository.create({
          user: savedUser,
          league: league,
          isAdmin: false,
          isBlocked: false,
        });
        await this.leagueParticipantRepository.save(participant);
      }
    }

    return savedUser;
  }

  async delete(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    try {
      // 1. Liberar códigos de acceso usados por este usuario
      // (Opcional: podrías querer dejarlos como "glitched" o borrarlos, pero liberarlos permite reutilización si fue error)
      // Si prefieres que NO se reutilicen, podrías poner status: AccessCodeStatus.USED pero usedBy: null.
      // Aquí asumiremos que queremos desvincularlos.
      await this.accessCodeRepository.update(
        { usedBy: { id } },
        { usedBy: null as any, status: AccessCodeStatus.AVAILABLE },
      );

      // 2. Eliminar Predicciones
      await this.predictionRepository.delete({ user: { id } });

      // 3. Eliminar Participaciones en Ligas
      await this.leagueParticipantRepository.delete({ user: { id } });

      // 4. Eliminar Respuestas Bonus
      await this.userBonusAnswerRepository.delete({ userId: id });

      // 5. Eliminar Brackets
      await this.userBracketRepository.delete({ userId: id });

      // 6. Eliminar Usuario
      const result = await this.usersRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }
    } catch (error) {
      console.error(
        `❌ [UsersService] Error eliminando usuario ${id}:`,
        error,
      );
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    email: string,
    fullName: string,
    password?: string,
    googleId?: string,
    avatarUrl?: string,
    phoneNumber?: string,
  ): Promise<User> {
    const newUser = this.usersRepository.create({
      email,
      fullName,
      password,
      googleId,
      avatarUrl,
      phoneNumber,
      role: UserRole.PLAYER,
    });
    return this.usersRepository.save(newUser);
  }

  async update(user: User, updates: Partial<User>): Promise<User> {
    Object.assign(user, updates);
    return this.usersRepository.save(user);
  }

  async updateProfile(
    userId: string,
    updates: {
      nickname?: string;
      fullName?: string;
      phoneNumber?: string;
      avatarUrl?: string;
    },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updates.nickname) user.nickname = updates.nickname;
    if (updates.fullName) user.fullName = updates.fullName;
    if (updates.phoneNumber) user.phoneNumber = updates.phoneNumber;
    if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl;

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      console.error('❌ [UsersService] Error updating profile:', error);
      throw error;
    }
  }
}
