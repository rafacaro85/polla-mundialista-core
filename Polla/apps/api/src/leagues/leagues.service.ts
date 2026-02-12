import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { League } from '../database/entities/league.entity';
import { User } from '../database/entities/user.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { AccessCode } from '../database/entities/access-code.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { LeagueComment } from '../database/entities/league-comment.entity';
import { LeagueType } from '../database/enums/league-type.enum';
import { LeagueStatus } from '../database/enums/league-status.enum';
import { UserRole } from '../database/enums/user-role.enum';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from '../database/enums/transaction-status.enum';
import { PdfService } from '../common/pdf/pdf.service';

import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class LeaguesService {
  constructor(
    @InjectRepository(League)
    private leaguesRepository: Repository<League>,
    @InjectRepository(LeagueParticipant)
    private leagueParticipantsRepository: Repository<LeagueParticipant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Prediction)
    private predictionRepository: Repository<Prediction>,
    @InjectRepository(LeagueComment)
    private leagueCommentsRepository: Repository<LeagueComment>,
    private transactionsService: TransactionsService,
    private pdfService: PdfService,
    private telegramService: TelegramService,
  ) {}

  async createLeague(
    userId: string,
    createLeagueDto: CreateLeagueDto,
  ): Promise<League> {
    try {
      const {
        name,
        type,
        maxParticipants,
        accessCodePrefix,
        packageType,
        isEnterprise,
        companyName,
        adminName,
        adminPhone,
        adminEmail,
        adminPassword,
        tournamentId,
      } = createLeagueDto;

      console.log('--- CREATE LEAGUE DEBUG ---');
      console.log('Package Type:', packageType);
      console.log(
        'Calculated isPaid:',
        packageType === 'starter' || packageType === 'FREE',
      );
      console.log('---------------------------');

      // Validate maxUsers based on packageType
      // This is a basic validation, you might want to move this to a config or constant
      if (packageType === 'starter' && maxParticipants > 3) {
        throw new BadRequestException(
          'El plan Starter solo permite hasta 3 participantes.',
        );
      }
      // Add more validations for other plans if needed

      // Si es tipo 'VIP' (mÃ¡x 5)
      if (type === LeagueType.VIP && maxParticipants > 5) {
        throw new BadRequestException(
          'Las ligas VIP no pueden tener mÃ¡s de 5 participantes.',
        );
      }

      let creator = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!creator) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      // SUPER ADMIN: Crear liga para TERCERO (Empresa)
      if (
        creator.role === UserRole.SUPER_ADMIN &&
        adminEmail &&
        adminPassword
      ) {
        const targetUser = await this.userRepository.findOne({
          where: { email: adminEmail },
        });

        if (targetUser) {
          console.log(
            `ðŸ‘¤ [CreateLeague] Asignando liga a usuario existente: ${adminEmail}`,
          );
          creator = targetUser;
        } else {
          console.log(
            `ðŸ‘¤ [CreateLeague] Creando nuevo usuario para empresa: ${adminEmail}`,
          );
          const hashedPassword = await bcrypt.hash(adminPassword, 10);
          const newUser = this.userRepository.create({
            email: adminEmail,
            fullName: adminName || 'Administrador Empresa',
            nickname: adminName || adminEmail.split('@')[0], // Fallback nickname
            password: hashedPassword,
            phoneNumber: adminPhone,
            isVerified: true, // Auto-verificado por SuperAdmin
            role: UserRole.PLAYER,
          });
          creator = await this.userRepository.save(newUser);
        }
      }

      // --- LIMIT CHECK: 1 Free League Per User Per Tournament ---
      const targetTournamentId = tournamentId || 'WC2026';
      const isFreePlan = ['familia', 'starter', 'FREE'].includes(packageType);

      if (isFreePlan) {
        // Count existing leagues for this user in this tournament
        const existingLeaguesCount = await this.leaguesRepository.count({
          where: {
            creator: { id: creator.id },
            tournamentId: targetTournamentId,
          },
        });

        if (existingLeaguesCount >= 1) {
          throw new BadRequestException(
            'Ya tienes una polla creada para este torneo. Solo se permite una polla gratuita por usuario.',
          );
        }
      }
      // -----------------------------------------------------

      // Generar cÃ³digo automÃ¡tico si no se proporciona
      let code = accessCodePrefix;

      if (!code) {
        if ((isEnterprise || type === LeagueType.COMPANY) && companyName) {
          code = this.generateEnterpriseCode(companyName);
        } else {
          code = this.generateCode();
        }
      }

      const league = this.leaguesRepository.create({
        name,
        type,
        maxParticipants,
        creator,
        accessCodePrefix: code,
        // Si es 'familia' o 'starter' (gratis), se considera pagado/activo.
        // Si es ENTERPRISE creada por SuperAdmin, se asume pagada o pendiente segÃºn config,
        // pero generalmente las empresas se crean activas o pendientes.
        // Asumiremos que si viene de SuperAdmin es ENTERPRISE y quizas pagada manual, pero dejemos isPaid false si no es free,
        // luego el admin la activa con el botÃ³n de pago si es necesario, O si es Enterprise activarla.
        // ACTUALIZACIÃ“N: Si es enterprise, createLeagueDto suele marcar isEnterpriseActive en otro lado, pero aquÃ­ isPaid se rige por type.
        // Vamos a dejar la lÃ³gica actual: solo FREE es paid auto. Enterprise se paga manual o por botÃ³n.
        isPaid: ['familia', 'starter', 'FREE'].includes(packageType),
        packageType,
        isEnterprise: !!isEnterprise,
        companyName: companyName,
        adminName: adminName,
        adminPhone: adminPhone,
        tournamentId: tournamentId || 'WC2026', // Default to WC2026 if not provided
      });

      const savedLeague = await this.leaguesRepository.save(league);

      // ðŸ“¢ Admin Alert (ðŸ†) - New League
      const isPaid = ['familia', 'starter', 'FREE'].includes(packageType); // Logic copied from isPaid above
      const creatorPhone = adminPhone || creator.phoneNumber; // Use provided admin phone or fallback to profile
      const creatorName = adminName || creator.fullName;

      this.telegramService
        .notifyNewLeague(
          savedLeague.name,
          savedLeague.accessCodePrefix || 'N/A',
          creator.email,
          creatorPhone,
          creatorName,
          packageType,
        )
        .catch((e) => console.error('Telegram Error (Leagues):', e));

      // ACTUALIZAR DATOS DEL USUARIO (FidelizaciÃ³n)
      // Si el usuario proporcionÃ³ un telÃ©fono de contacto para la liga, lo guardamos en su perfil
      // Solo si NO acabamos de crear al usuario con ese dato
      if (adminPhone && creator.phoneNumber !== adminPhone) {
        creator.phoneNumber = adminPhone;
        await this.userRepository.save(creator);
        console.log(
          `ðŸ“ž [CreateLeague] Actualizado telÃ©fono del usuario ${creator.id}: ${adminPhone}`,
        );
      }

      // Create Transaction only for FREE plans
      if (['familia', 'starter', 'FREE'].includes(packageType)) {
        await this.transactionsService.createTransaction(
          creator,
          0,
          packageType,
          savedLeague.id,
          targetTournamentId,
          TransactionStatus.PAID,
        );
      }

      // Automatically add the creator as a participant
      const participant = this.leagueParticipantsRepository.create({
        user: creator,
        league: savedLeague,
        isAdmin: true, // Creator is admin of the league
      });
      await this.leagueParticipantsRepository.save(participant);

      return savedLeague;
    } catch (error) {
      console.error('Error in createLeague:', error); // Log the actual error
      
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        'Failed to create league.',
        error.message,
      );
    }
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres ambiguos
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateEnterpriseCode(companyName: string): string {
    // 1. Limpiar nombre: MayÃºsculas y solo letras/nÃºmeros
    const cleanName = companyName.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Eliminar espacios y sÃ­mbolos

    // 2. Tomar prefijo (Max 6-8 chars)
    const prefix = cleanName.length > 8 ? cleanName.substring(0, 8) : cleanName;

    // 3. Generar sufijo aleatorio (3 chars/nums para evitar colisiones simples)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `${prefix}-${suffix}`;
  }

  async getMetadata(
    leagueId: string,
  ): Promise<{ league: League; availableSlots: number }> {
    const league = await this.leaguesRepository.findOne({
      where: { id: leagueId },
      relations: ['participants', 'participants.user', 'creator'],
    });

    if (!league) {
      throw new NotFoundException(`League with ID ${leagueId} not found.`);
    }

    const occupiedSlots = league.participants ? league.participants.length : 0;
    const availableSlots = league.maxParticipants - occupiedSlots;

    return { league, availableSlots: Math.max(0, availableSlots) };
  }

  async getLeagueDetails(leagueId: string, userId?: string) {
    const league = await this.leaguesRepository.findOne({
      where: { id: leagueId },
      relations: ['participants', 'participants.user', 'creator'],
    });

    if (!league) {
      console.log(`[DEBUG] League ${leagueId} not found`);
      throw new NotFoundException(`League with ID ${leagueId} not found.`);
    }

    console.log(
      `[DEBUG] League Details ${leagueId}: Found ${league.participants?.length || 0} participants`,
    );

    // Check if user is blocked
    if (userId) {
      const requester = league.participants.find((p) => p.user.id === userId);
      if (requester?.isBlocked) {
        throw new ForbiddenException(
          'Has sido bloqueado de esta liga por el administrador.',
        );
      }
    }

    // Map participants to include user info
    const participants = league.participants.map((p) => ({
      id: p.id,
      userId: p.user.id,
      nickname: p.user.nickname || p.user.fullName,
      fullName: p.user.fullName,
      avatarUrl: p.user.avatarUrl,
      isAdmin: p.isAdmin,
      isBlocked: p.isBlocked,
      triviaPoints: p.triviaPoints || 0,
    }));

    return {
      id: league.id,
      name: league.name,
      accessCodePrefix: league.accessCodePrefix,
      maxParticipants: league.maxParticipants,
      creatorId: league.creator.id,
      creatorName: league.creator.nickname || league.creator.fullName,
      participants,
      participantCount: participants.length,
      availableSlots: Math.max(0, league.maxParticipants - participants.length),
      // Ads
      showAds: !!league.showAds,
      adImages: league.adImages || [],
      // Enterprise Config (Added for Studio)
      isEnterprise: league.isEnterprise,
      isEnterpriseActive: league.isEnterpriseActive,
      packageType: league.packageType,
      companyName: league.companyName,
      brandingLogoUrl: league.brandingLogoUrl,
      brandColorPrimary: league.brandColorPrimary,
      brandColorSecondary: league.brandColorSecondary,
      brandColorBg: league.brandColorBg,
      brandColorText: league.brandColorText,
      brandFontFamily: league.brandFontFamily,
      brandCoverUrl: league.brandCoverUrl,
      welcomeMessage: league.welcomeMessage,
      prizeImageUrl: league.prizeImageUrl,
      prizeDetails: league.prizeDetails,
      // Social
      socialInstagram: league.socialInstagram,
      socialFacebook: league.socialFacebook,
      socialWhatsapp: league.socialWhatsapp,
      socialYoutube: league.socialYoutube,
      socialTiktok: league.socialTiktok,
      socialLinkedin: league.socialLinkedin,
      socialWebsite: league.socialWebsite,
      enableDepartmentWar: league.enableDepartmentWar,
      isPaid: league.isPaid,
    };
  }

  async getLeagueByCode(code: string) {
    const league = await this.leaguesRepository.findOne({
      where: { accessCodePrefix: code },
      relations: ['creator'],
    });

    if (!league) {
      throw new NotFoundException('Liga no encontrada');
    }

    return {
      id: league.id,
      name: league.name,
      brandingLogoUrl: league.brandingLogoUrl,
      prizeImageUrl: league.prizeImageUrl,
      prizeDetails: league.prizeDetails,
      welcomeMessage: league.welcomeMessage,
      creatorName: league.creator.nickname || league.creator.fullName,
      type: league.type,
      isEnterprise: league.type === LeagueType.COMPANY || league.isEnterprise,
      companyName: league.companyName,
      enableDepartmentWar: !!league.enableDepartmentWar,
    };
  }

  // 2. Fetch Prediction Points (Global - Separated by Joker/Regular)
  // We use DISTINCT ON to get the best scoring prediction for each match per user
  // MOD: Filter by tournamentId to isolate rankings!

  // Determine tournament context. If not passed, we might be in trouble for "Global".
  // Global Leagues generally don't have tournamentId in the old logic, maybe new ones do.
  // If this method is called for "Global Ranking Screen", we need to know context.
  // Let's assume prediction points are now tagged.

  // We need to join with matches to be sure or trust prediction.tournamentId if populated.
  // Better safe: join match or filter if we have tournamentId.
  // BUT getGlobalRanking signature is () -> []. It needs an update.

  // Wait, getGlobalRanking is used by Cron/Schedule? Or frontend?
  // Let's update signature to accept tournamentId.

  async getGlobalRanking(tournamentId: string) {
    // 1. Obtener IDs de usuarios ACTIVOS en este torneo (Global Context Only)
    // Un usuario es activo si tiene al menos un registro en:
    // - Prediccione  async getGlobalRanking(tournamentId: string) {
    // 🔍 VERSION CRÍTICA: FUERZA VISIBILIDAD (User-Centric)
    // Se eliminó la restricción estricta de league_id IS NULL para ver si los usuarios aparecen.
    // Ahora se suman TODOS los puntos del torneo, independientemente del contexto de liga.
    
    console.log(`🚀 Iniciando Global Ranking para: ${tournamentId}`);

    const rawQuery = `
      WITH 
      predictions_data AS (
        SELECT p."userId", 
               SUM(CASE WHEN p."isJoker" IS TRUE THEN p.points / 2 ELSE 0 END) as joker_points,
               SUM(CASE WHEN p."isJoker" IS TRUE THEN p.points / 2 ELSE p.points END) as regular_points
        FROM predictions p
        INNER JOIN matches m ON m.id = p."matchId"
        WHERE m."tournamentId" = $1 
        GROUP BY p."userId"
      ),
      brackets_data AS (
        SELECT "userId", SUM(points) as points 
        FROM user_brackets 
        WHERE "tournamentId" = $1 
        GROUP BY "userId"
      ),
      bonus_data AS (
        SELECT uba."userId", SUM(uba."pointsEarned") as points
        FROM user_bonus_answers uba
        INNER JOIN bonus_questions bq ON bq.id = uba."questionId"
        WHERE bq."tournamentId" = $1 
        GROUP BY uba."userId"
      )
      SELECT 
        u.id, 
        u.nickname, 
        u."full_name" as "fullName", 
        u."avatar_url" as "avatarUrl",
        u.email,
        COALESCE(p.regular_points, 0) as "regularPoints",
        COALESCE(p.joker_points, 0) as "jokerPoints",
        COALESCE(b.points, 0) as "bracketPoints",
        COALESCE(bonus.points, 0) as "bonusPoints",
        (COALESCE(p.regular_points, 0) + COALESCE(p.joker_points, 0) + COALESCE(b.points, 0) + COALESCE(bonus.points, 0)) as "totalPoints"
      FROM users u
      LEFT JOIN predictions_data p ON p."userId" = u.id
      LEFT JOIN brackets_data b ON b."userId" = u.id
      LEFT JOIN bonus_data bonus ON bonus."userId" = u.id
      WHERE 
        (p."userId" IS NOT NULL OR b."userId" IS NOT NULL OR bonus."userId" IS NOT NULL)
        AND u.email NOT LIKE '%@demo.com' 
        AND u.email NOT IN ('demo@lapollavirtual.com', 'demo-social@lapollavirtual.com')
      ORDER BY "totalPoints" DESC, u."fullName" ASC
    `;

    try {
      const results = await this.userRepository.manager.query(rawQuery, [tournamentId]);
      
      console.log(`📊 Global Ranking Count (${tournamentId}):`, results.length);
      if (results.length > 0) {
        console.log('Sample User:', results[0]);
      } else {
        console.warn('⚠️ Global Ranking is EMPTY.');
      }

      return results.map((user: any, index: number) => ({
        position: index + 1,
        id: user.id,
        fullName: user.fullName || user.nickname || 'Anónimo', // Frontend expects fullName
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        regularPoints: Number(user.regularPoints),
        jokerPoints: Number(user.jokerPoints),
        bracketPoints: Number(user.bracketPoints),
        bonusPoints: Number(user.bonusPoints),
        totalPoints: Number(user.totalPoints),
        breakdown: {
            matches: Number(user.regularPoints),
            phases: Number(user.bracketPoints),
            wildcard: Number(user.jokerPoints),
            bonus: Number(user.bonusPoints),
        },
      }));

    } catch (error) {
      console.error('❌ Error executing Global Ranking Query:', error);
      return [];
    }
  }
  async getAllLeagues(tournamentId?: string) {
    try {
      const leagues = await this.leaguesRepository.find({
        where: tournamentId ? { tournamentId } : {},
        relations: ['creator', 'participants'],
        order: { name: 'ASC' },
      });

      console.log(`âœ… Found ${leagues.length} leagues`);

      return leagues.map((l) => ({
        id: l.id,
        name: l.name,
        code: l.accessCodePrefix || 'SIN-CODIGO',
        type: l.type,
        maxParticipants: l.maxParticipants,
        creator: {
          id: l.creator?.id,
          nickname: l.creator?.nickname || l.creator?.fullName || 'Desconocido',
          avatarUrl: l.creator?.avatarUrl,
        },
        participantCount: l.participants?.length || 0,
        isEnterprise: !!l.isEnterprise,
        isEnterpriseActive: !!l.isEnterpriseActive,
        packageType: l.packageType,
        brandingLogoUrl: l.brandingLogoUrl,
        prizeImageUrl: l.prizeImageUrl,
        prizeDetails: l.prizeDetails,
        welcomeMessage: l.welcomeMessage,
        companyName: l.companyName,
        isPaid: l.isPaid,
      }));
    } catch (error) {
      console.error('âŒ CRITICAL ERROR in getAllLeagues:', error);
      console.error('Error stack:', error.stack);
      throw new InternalServerErrorException(
        `Error al cargar ligas: ${error.message}`,
      );
    }
  }

  async getMyLeagues(userId: string, tournamentId?: string) {
    console.log(`[LeaguesService] getMyLeagues for user: ${userId}, tournament: ${tournamentId}`);
    
    const query = this.leagueParticipantsRepository.createQueryBuilder('participant')
      .innerJoinAndSelect('participant.league', 'league')
      .leftJoinAndSelect('league.creator', 'creator')
      .leftJoinAndSelect('league.participants', 'leagueParticipants')
      .where('participant.user_id = :userId', { userId });

    if (tournamentId && tournamentId !== 'all') {
      query.andWhere('league.tournamentId = :tournamentId', { tournamentId });
    }

    const participants = await query.getMany();
    
    const result = participants.map((p) => ({
      id: p.league.id,
      name: p.league.name,
      code: p.league.accessCodePrefix,
      type: p.league.type,
      isAdmin: p.isAdmin,
      creatorName: p.league.creator?.nickname || p.league.creator?.fullName || 'Admin',
      participantCount: p.league.participants?.length || 0,
      isEnterprise: p.league.isEnterprise,
      isEnterpriseActive: p.league.isEnterpriseActive,
      companyName: p.league.companyName,
      brandingLogoUrl: p.league.brandingLogoUrl,
      brandColorPrimary: p.league.brandColorPrimary,
      brandColorSecondary: p.league.brandColorSecondary,
      brandColorBg: p.league.brandColorBg,
      brandColorText: p.league.brandColorText,
      brandFontFamily: p.league.brandFontFamily,
      brandCoverUrl: p.league.brandCoverUrl,
      welcomeMessage: p.league.welcomeMessage,
      prizeImageUrl: p.league.prizeImageUrl,
      prizeDetails: p.league.prizeDetails,
      isPaid: p.league.isPaid,
      packageType: p.league.packageType,
      showAds: p.league.showAds,
      adImages: p.league.adImages,
    }));

    return result;
  }

  async getParticipants(leagueId: string, userId: string, userRole?: string) {
    // 1. Verificar si es Super Admin
    if (userRole === 'SUPER_ADMIN') {
      return this.fetchParticipants(leagueId);
    }

    // 2. Verificar si es Admin de la Liga
    const requester = await this.leagueParticipantsRepository.findOne({
      where: { league: { id: leagueId }, user: { id: userId } },
    });

    if (!requester || !requester.isAdmin) {
      throw new ForbiddenException(
        'No tienes permisos para ver los participantes de esta liga.',
      );
    }

    return this.fetchParticipants(leagueId);
  }

  private async fetchParticipants(leagueId: string) {
    const participants = await this.leagueParticipantsRepository.find({
      where: { league: { id: leagueId } },
      relations: ['user'],
      order: { totalPoints: 'DESC' },
    });

    return participants.map((p) => ({
      ...p,
      user: {
        id: p.user.id,
        nickname: p.user.nickname,
        fullName: p.user.fullName,
        email: p.user.email,
        avatarUrl: p.user.avatarUrl,
        phoneNumber: p.user.phoneNumber,
      },
      status: p.isBlocked ? 'BLOCKED' : 'ACTIVE',
      // Breakdown for Transparency UI
      breakdown: {
        matches: p.predictionPoints || 0,
        phases: p.bracketPoints || 0,
        wildcard: p.jokerPoints || 0,
        bonus: p.triviaPoints || 0,
      },
    }));
  }

  async getLeagueForUser(leagueId: string, userId: string) {
    const participant = await this.leagueParticipantsRepository.findOne({
      where: { league: { id: leagueId }, user: { id: userId } },
      relations: ['league', 'league.creator', 'league.participants'],
    });

    // 2. If participant found, return standard format
    if (participant) {
      return {
        id: participant.league.id,
        name: participant.league.name,
        code: participant.league.accessCodePrefix,
        type: participant.league.type,
        isAdmin: participant.isAdmin,
        creatorName:
          participant.league.creator.nickname ||
          participant.league.creator.fullName,
        participantCount: participant.league.participants?.length || 0,
        isEnterprise: participant.league.isEnterprise,
        isEnterpriseActive: participant.league.isEnterpriseActive,
        companyName: participant.league.companyName,
        brandingLogoUrl: participant.league.brandingLogoUrl,
        brandColorPrimary: participant.league.brandColorPrimary,
        brandColorSecondary: participant.league.brandColorSecondary,
        brandColorBg: participant.league.brandColorBg,
        brandColorText: participant.league.brandColorText,
        brandFontFamily: participant.league.brandFontFamily,
        brandCoverUrl: participant.league.brandCoverUrl,
        welcomeMessage: participant.league.welcomeMessage,
        prizeImageUrl: participant.league.prizeImageUrl,
        prizeDetails: participant.league.prizeDetails,
        status: participant.league.status,
        isPaid: participant.league.isPaid,
        maxParticipants: participant.league.maxParticipants,
        packageType: participant.league.packageType,
        // Missing fields essential for Admin Panels Hydration
        enableDepartmentWar: participant.league.enableDepartmentWar,
        socialInstagram: participant.league.socialInstagram,
        socialFacebook: participant.league.socialFacebook,
        socialWhatsapp: participant.league.socialWhatsapp,
        socialYoutube: participant.league.socialYoutube,
        socialTiktok: participant.league.socialTiktok,
        socialLinkedin: participant.league.socialLinkedin,
        socialWebsite: participant.league.socialWebsite,
        showAds: participant.league.showAds,
        adImages: participant.league.adImages,
      };
    }

    // 3. If not participant, check if SUPER_ADMIN
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user?.role === UserRole.SUPER_ADMIN) {
      // Fetch league directly
      const league = await this.leaguesRepository.findOne({
        where: { id: leagueId },
        relations: ['creator', 'participants'],
      });

      if (league) {
        return {
          id: league.id,
          name: league.name,
          code: league.accessCodePrefix,
          type: league.type,
          isAdmin: true, // Super Admin is effectively an admin
          creatorName: league.creator.nickname || league.creator.fullName,
          participantCount: league.participants?.length || 0,
          isEnterprise: league.isEnterprise,
          isEnterpriseActive: league.isEnterpriseActive,
          companyName: league.companyName,
          brandingLogoUrl: league.brandingLogoUrl,
          brandColorPrimary: league.brandColorPrimary,
          brandColorSecondary: league.brandColorSecondary,
          brandColorBg: league.brandColorBg,
          brandColorText: league.brandColorText,
          brandFontFamily: league.brandFontFamily,
          brandCoverUrl: league.brandCoverUrl,
          welcomeMessage: league.welcomeMessage,
          prizeImageUrl: league.prizeImageUrl,
          prizeDetails: league.prizeDetails,
          status: league.status,
          isPaid: league.isPaid,
          maxParticipants: league.maxParticipants,
          packageType: league.packageType,
          // Missing fields essential for Admin Panels Hydration
          enableDepartmentWar: league.enableDepartmentWar,
          socialInstagram: league.socialInstagram,
          socialFacebook: league.socialFacebook,
          socialWhatsapp: league.socialWhatsapp,
          socialYoutube: league.socialYoutube,
          socialTiktok: league.socialTiktok,
          socialLinkedin: league.socialLinkedin,
          socialWebsite: league.socialWebsite,
          showAds: league.showAds,
          adImages: league.adImages,
        };
      }
    }

    throw new NotFoundException(
      'League not found or user is not a participant',
    );
  }

  async getLeagueRanking(leagueId: string) {
    const league = await this.leaguesRepository.findOne({
      where: { id: leagueId },
    });
    if (!league) throw new NotFoundException('League not found');

    const participants = await this.leagueParticipantsRepository.find({
      where: { league: { id: leagueId } },
      relations: ['user'],
    });

    if (!participants || participants.length === 0) return [];

    const activeParticipants = participants.filter((p) => !p.isBlocked);
    const userIds = activeParticipants.map((p) => p.user.id);

    // Goles Reales para Tiebreaker
    const goalsResult = await this.leaguesRepository.manager
      .createQueryBuilder(Match, 'm')
      .select(
        'SUM(COALESCE(m.homeScore, 0) + COALESCE(m.awayScore, 0))',
        'total',
      )
      .where("m.status IN ('FINISHED', 'COMPLETED')")
      .getRawOne();
    const realGoals = Number(goalsResult?.total || goalsResult?.TOTAL || 0);

    // Prediction Points (Improved to include Global Fallback and Joker separation)
    const isGlobal = league.type === LeagueType.GLOBAL;
    const allPredictions = await this.predictionRepository
      .createQueryBuilder('p')
      .innerJoin('p.match', 'm')
      .select(['p.userId', 'p.matchId', 'p.points', 'p.leagueId', 'p.isJoker'])
      .where('p.userId IN (:...userIds)', { userIds })
      .andWhere(
        isGlobal
          ? 'p.leagueId IS NULL'
          : '(p.leagueId = :leagueId OR p.leagueId IS NULL)',
        { leagueId },
      )
      .andWhere("m.status IN ('FINISHED', 'COMPLETED')")
      .getRawMany();

    // Map to keep track of points: { userId: { matchId: { points, isJoker } } }
    // We prioritize league-specific predictions over global fallback
    const userPointsMap = new Map<
      string,
      Map<string, { points: number; isJoker: boolean }>
    >();

    allPredictions.forEach((r) => {
      const uId = r.userId || r.userid || r.p_user_id;
      const mId = r.matchId || r.matchid || r.p_match_id;
      let points = Number(r.points || r.p_points || 0);
      const isJoker = !!(r.isJoker || r.p_isJoker);
      const pLeagueId = r.leagueId || r.leagueid || r.p_league_id;

      if (!userPointsMap.has(uId)) {
        userPointsMap.set(uId, new Map());
      }
      
      const userMatches = userPointsMap.get(uId)!;

      // FIX RANKING: Independencia de Comodines.
      // Si estamos en una liga local (!isGlobal) y usamos una predicción global (pLeagueId === null),
      // ignoramos su Joker para el cálculo de puntos de esta liga.
      let effectiveIsJoker = isJoker;
      if (!isGlobal && pLeagueId === null) {
          effectiveIsJoker = false;
          // CRITICAL FIX: If we ignore the joker, we must also revert the points multiplier!
          if (isJoker) {
              points = points / 2;
          }
      }

      // Si no existe predicción para este partido aún en el mapa, o la que hay es global y la nueva es específica de liga
      if (!userMatches.has(mId) || pLeagueId === leagueId) {
        userMatches.set(mId, { points, isJoker: effectiveIsJoker });
      }
    });

    const predRegularMap = new Map<string, number>();
    const predJokerMap = new Map<string, number>();

    userPointsMap.forEach((matchesMap, uId) => {
      let regTotal = 0;
      let jokerTotal = 0;
      matchesMap.forEach(({ points, isJoker }) => {
        // FIX BREAKDOWN: "Partidos" = Base Score, "Comodín" = Extra Score
        if (isJoker) {
          const base = points / 2;
          const extra = points / 2;
          regTotal += base;
          jokerTotal += extra;
        } else {
          regTotal += points;
        }
      });
      predRegularMap.set(uId, regTotal);
      predJokerMap.set(uId, jokerTotal);
    });

    // Bracket Points
    const bracketPointsRows = await this.userRepository.manager
      .createQueryBuilder(UserBracket, 'b')
      .select('b.userId', 'userId')
      .addSelect('MAX(b.points)', 'points')
      .where('b.userId IN (:...userIds)', { userIds })
      .andWhere('(b.leagueId = :leagueId OR b.leagueId IS NULL)', { leagueId })
      .groupBy('b.userId')
      .getRawMany();

    const bracketMap = new Map(
      bracketPointsRows.map((r) => [
        r.userId || r.userid,
        Number(r.points || r.POINTS || 0),
      ]),
    );

    // Bonus Points
    const bonusPointsRows = await this.userRepository.manager
      .createQueryBuilder(UserBonusAnswer, 'uba')
      .innerJoin('uba.question', 'bq')
      .select('uba.userId', 'userId')
      .addSelect('SUM(uba.pointsEarned)', 'points')
      .where('uba.userId IN (:...userIds)', { userIds })
      .andWhere('bq.leagueId = :leagueId', { leagueId })
      .groupBy('uba.userId')
      .getRawMany();

    const bonusMap = new Map(
      bonusPointsRows.map((r) => [
        r.userId || r.userid,
        Number(r.points || r.POINTS || 0),
      ]),
    );

    const finalRanking = activeParticipants.map((lp) => {
      const uId = lp.user.id;
      const regularPoints = predRegularMap.get(uId) || 0;
      const jokerPoints = predJokerMap.get(uId) || 0;
      const bracketPoints = bracketMap.get(uId) || 0;
      const bonusPoints = bonusMap.get(uId) || 0;
      const triviaPoints = Number(lp.triviaPoints || 0);

      const totalPoints =
        regularPoints +
        jokerPoints +
        bracketPoints +
        bonusPoints +
        triviaPoints;

      const tieBreakerGuess =
        lp.tieBreakerGuess !== null && lp.tieBreakerGuess !== undefined
          ? Number(lp.tieBreakerGuess)
          : null;

      return {
        id: uId,
        fullName: lp.user.fullName, // ADDED for frontend display
        nickname: lp.user.fullName || lp.user.nickname || 'Usuario',
        avatarUrl: lp.user.avatarUrl,
        regularPoints,
        jokerPoints,
        bracketPoints,
        bonusPoints,
        triviaPoints,
        totalPoints,
        tieBreakerGuess,
        tieBreakerDiff:
          tieBreakerGuess !== null
            ? Math.abs(tieBreakerGuess - realGoals)
            : Infinity,
        department: lp.department,
      };
    });

    finalRanking.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.tieBreakerDiff - b.tieBreakerDiff;
    });

    return finalRanking.map((user, index) => ({
      ...user,
      rank: index + 1,
      breakdown: {
        matches: user.regularPoints || 0,
        phases: user.bracketPoints || 0,
        wildcard: user.jokerPoints || 0,
        bonus: user.bonusPoints || 0,
      },
    }));
  }

  // --- ADMIN METHODS ---

  async updateParticipantScore(
    leagueId: string,
    userId: string,
    totalPoints?: number,
    triviaPoints?: number,
    predictionPoints?: number,
    bracketPoints?: number,
    jokerPoints?: number,
  ) {
    const participant = await this.leagueParticipantsRepository.findOne({
      where: { league: { id: leagueId }, user: { id: userId } },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (totalPoints !== undefined) participant.totalPoints = totalPoints;
    if (triviaPoints !== undefined) participant.triviaPoints = triviaPoints;
    if (predictionPoints !== undefined)
      participant.predictionPoints = predictionPoints;
    if (bracketPoints !== undefined) participant.bracketPoints = bracketPoints;
    if (jokerPoints !== undefined) participant.jokerPoints = jokerPoints;

    console.log(
      `âœï¸ [updateParticipantScore] Updated ${userId} in ${leagueId}. Tot:${totalPoints} Triv:${triviaPoints} Pred:${predictionPoints} Bra:${bracketPoints} Jok:${jokerPoints}`,
    );

    return this.leagueParticipantsRepository.save(participant);
  }

  async updateLeague(
    leagueId: string,
    userId: string,
    updateLeagueDto: UpdateLeagueDto,
    userRole: string,
  ) {
    const league = await this.leaguesRepository.findOne({
      where: { id: leagueId },
      relations: ['creator'],
    });

    if (!league) {
      throw new NotFoundException(`Liga con ID ${leagueId} no encontrada`);
    }

    // Verificar permisos: SUPER_ADMIN o admin de la liga
    if (userRole !== 'SUPER_ADMIN' && league.creator.id !== userId) {
      throw new ForbiddenException('No tienes permisos para editar esta liga');
    }

    // Actualizar campos
    if (updateLeagueDto.name) {
      league.name = updateLeagueDto.name;
    }

    if (updateLeagueDto.maxParticipants !== undefined) {
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Solo el SUPER_ADMIN puede modificar el lÃ­mite de participantes',
        );
      }
      league.maxParticipants = updateLeagueDto.maxParticipants;
    }

    if (updateLeagueDto.brandingLogoUrl !== undefined)
      league.brandingLogoUrl = updateLeagueDto.brandingLogoUrl;
    if (updateLeagueDto.prizeImageUrl !== undefined)
      league.prizeImageUrl = updateLeagueDto.prizeImageUrl;
    if (updateLeagueDto.prizeDetails !== undefined)
      league.prizeDetails = updateLeagueDto.prizeDetails;
    if (updateLeagueDto.welcomeMessage !== undefined)
      league.welcomeMessage = updateLeagueDto.welcomeMessage;
    if (updateLeagueDto.isEnterprise !== undefined)
      league.isEnterprise = updateLeagueDto.isEnterprise;
    if (updateLeagueDto.companyName !== undefined)
      league.companyName = updateLeagueDto.companyName;
    if (updateLeagueDto.brandColorPrimary !== undefined)
      league.brandColorPrimary = updateLeagueDto.brandColorPrimary;
    if (updateLeagueDto.brandColorSecondary !== undefined)
      league.brandColorSecondary = updateLeagueDto.brandColorSecondary;
    if (updateLeagueDto.brandColorBg !== undefined)
      league.brandColorBg = updateLeagueDto.brandColorBg;
    if (updateLeagueDto.brandColorText !== undefined)
      league.brandColorText = updateLeagueDto.brandColorText;
    if (updateLeagueDto.brandFontFamily !== undefined)
      league.brandFontFamily = updateLeagueDto.brandFontFamily;
    if (updateLeagueDto.brandCoverUrl !== undefined)
      league.brandCoverUrl = updateLeagueDto.brandCoverUrl;
    if (updateLeagueDto.enableDepartmentWar !== undefined)
      league.enableDepartmentWar = updateLeagueDto.enableDepartmentWar;

    // --- SOCIAL MEDIA ---
    if (updateLeagueDto.socialInstagram !== undefined)
      league.socialInstagram = updateLeagueDto.socialInstagram;
    if (updateLeagueDto.socialFacebook !== undefined)
      league.socialFacebook = updateLeagueDto.socialFacebook;
    if (updateLeagueDto.socialWhatsapp !== undefined)
      league.socialWhatsapp = updateLeagueDto.socialWhatsapp;
    if (updateLeagueDto.socialYoutube !== undefined)
      league.socialYoutube = updateLeagueDto.socialYoutube;
    if (updateLeagueDto.socialTiktok !== undefined)
      league.socialTiktok = updateLeagueDto.socialTiktok;
    if (updateLeagueDto.socialLinkedin !== undefined)
      league.socialLinkedin = updateLeagueDto.socialLinkedin;
    if (updateLeagueDto.socialWebsite !== undefined)
      league.socialWebsite = updateLeagueDto.socialWebsite;

    // --- ADS ---
    if (updateLeagueDto.showAds !== undefined)
      league.showAds = updateLeagueDto.showAds;
    if (updateLeagueDto.adImages !== undefined)
      league.adImages = updateLeagueDto.adImages;

    if (updateLeagueDto.isEnterpriseActive !== undefined) {
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Solo el SUPER_ADMIN puede activar/desactivar el modo Enterprise.',
        );
      }
      league.isEnterpriseActive = updateLeagueDto.isEnterpriseActive;
    }

    if (updateLeagueDto.isPaid !== undefined) {
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Solo el SUPER_ADMIN puede modificar el estado de pago.',
        );
      }
      league.isPaid = updateLeagueDto.isPaid;
    }

    const updatedLeague = await this.leaguesRepository.save(league);

    console.log(`âœ… [updateLeague] Liga actualizada: ${updatedLeague.name}`);
    return updatedLeague;
  }

  async transferOwner(
    leagueId: string,
    requesterId: string,
    newAdminId: string,
    requesterRole: string,
  ) {
    // 1. Verificar que la liga existe
    const league = await this.leaguesRepository.findOne({
      where: { id: leagueId },
      relations: ['creator', 'participants', 'participants.user'],
    });

    if (!league) {
      throw new NotFoundException(`Liga con ID ${leagueId} no encontrada`);
    }

    // 2. Verificar permisos: SUPER_ADMIN o admin actual
    if (requesterRole !== 'SUPER_ADMIN' && league.creator.id !== requesterId) {
      throw new ForbiddenException(
        'Solo el SUPER_ADMIN o el admin actual pueden transferir la propiedad',
      );
    }

    // 3. Verificar que el nuevo admin es participante de la liga
    const newAdminParticipant = league.participants.find(
      (p) => p.user.id === newAdminId,
    );

    if (!newAdminParticipant) {
      throw new BadRequestException(
        'El nuevo administrador debe ser un participante de la liga',
      );
    }

    // 4. Obtener el nuevo admin completo
    const newAdmin = await this.userRepository.findOne({
      where: { id: newAdminId },
    });

    if (!newAdmin) {
      throw new NotFoundException(`Usuario con ID ${newAdminId} no encontrado`);
    }

    // 5. Actualizar el creador de la liga
    const oldAdminId = league.creator.id;
    league.creator = newAdmin;
    await this.leaguesRepository.save(league);

    // 6. Actualizar isAdmin en participants
    // Remover admin del anterior
    const oldAdminParticipant = league.participants.find(
      (p) => p.user.id === oldAdminId,
    );
    if (oldAdminParticipant) {
      oldAdminParticipant.isAdmin = false;
      await this.leagueParticipantsRepository.save(oldAdminParticipant);
    }

    // Agregar admin al nuevo
    newAdminParticipant.isAdmin = true;
    await this.leagueParticipantsRepository.save(newAdminParticipant);

    console.log(
      `âœ… [transferOwner] Propiedad transferida de ${oldAdminId} a ${newAdminId}`,
    );

    return {
      ...league,
      message: `Propiedad transferida exitosamente a ${newAdmin.nickname || newAdmin.fullName}`,
    };
  }

  async deleteLeague(leagueId: string, userId: string, userRole: string) {
    const league = await this.leaguesRepository.findOne({
      where: { id: leagueId },
      relations: ['creator'],
    });

    if (!league) {
      throw new NotFoundException(`Liga con ID ${leagueId} no encontrada`);
    }

    // Check permissions: Only SUPER_ADMIN or League Admin (Creator)
    console.log(`ðŸ” [deleteLeague] Verificando permisos...`);
    console.log(`   Creator ID: ${league.creator.id}`);
    console.log(`   Requester ID: ${userId}`);
    console.log(`   Requester Role: ${userRole}`);

    if (userRole !== 'SUPER_ADMIN' && league.creator.id !== userId) {
      console.error(`âŒ [deleteLeague] Permiso denegado.`);
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta liga',
      );
    }

    const manager = this.leaguesRepository.manager;

    try {
      console.log(
        `ðŸ—‘ï¸ [deleteLeague] Iniciando eliminaciÃ³n nuclear de liga ${leagueId}...`,
      );

      // EJECUCIÃ“N NUCLEAR: Usar transacciÃ³n para eliminar TODO
      await manager.transaction(async (transactionalEntityManager) => {
        // PASO 1: Logging (Participants check)
        const participantsCount = await transactionalEntityManager.count(
          LeagueParticipant,
          {
            where: { league: { id: leagueId } },
          },
        );
        console.log(
          `   ðŸ“‹ Paso 1: Encontrados ${participantsCount} participantes para eliminar.`,
        );

        // NOTA: Las predicciones son globales, no se tocan.

        // PASO 2: Eliminar respuestas de bonus questions
        console.log(`   â­ Paso 2: Eliminando respuestas de bonus...`);
        // Primero buscamos las preguntas de esta liga
        const questions = await transactionalEntityManager.find(BonusQuestion, {
          where: { league: { id: leagueId } },
          select: ['id'],
        });
        const questionIds = questions.map((q) => q.id);

        if (questionIds.length > 0) {
          await transactionalEntityManager.delete(UserBonusAnswer, {
            questionId: In(questionIds),
          });
          console.log(
            `   âœ“ Respuestas de bonus eliminadas (${questionIds.length} preguntas afectadas)`,
          );
        } else {
          console.log(`   âœ“ No hay respuestas de bonus para eliminar`);
        }

        // PASO 2.5: Eliminar comentarios del muro (LeagueComment)
        console.log(`   ðŸ’¬ Paso 2.5: Eliminando comentarios del muro...`);
        await transactionalEntityManager.delete(LeagueComment, {
          league: { id: leagueId },
        });
        console.log(`   âœ“ Comentarios eliminados`);

        // PASO 2.6: Eliminar predicciones especÃ­ficas de la liga
        console.log(`   ðŸ”® Paso 2.6: Eliminando predicciones de la liga...`);
        await transactionalEntityManager.delete(Prediction, {
          leagueId: leagueId,
        });
        console.log(`   âœ“ Predicciones de liga eliminadas`);

        // PASO 3: Eliminar bonus questions
        console.log(`   â­ Paso 3: Eliminando bonus questions...`);
        await transactionalEntityManager.delete(BonusQuestion, {
          league: { id: leagueId },
        });
        console.log(`   âœ“ Bonus questions eliminadas`);

        // PASO 4: Eliminar brackets de usuarios
        console.log(`   ðŸ† Paso 4: Eliminando brackets...`);
        await transactionalEntityManager.delete(UserBracket, {
          league: { id: leagueId },
        });
        console.log(`   âœ“ Brackets eliminados`);

        // PASO 5: Eliminar cÃ³digos de acceso
        console.log(`   ðŸ”‘ Paso 5: Eliminando cÃ³digos de acceso...`);
        await transactionalEntityManager.delete(AccessCode, {
          league: { id: leagueId },
        });
        console.log(`   âœ“ CÃ³digos de acceso eliminados`);

        // PASO 6: Eliminar transacciones/pagos
        console.log(`   ðŸ’³ Paso 6: Eliminando transacciones...`);
        await transactionalEntityManager.delete(Transaction, {
          league: { id: leagueId },
        });
        console.log(`   âœ“ Transacciones eliminadas`);

        // PASO 7: Eliminar participantes de la liga
        console.log(`   ðŸ‘¥ Paso 7: Eliminando participantes...`);
        await transactionalEntityManager.delete(LeagueParticipant, {
          league: { id: leagueId },
        });
        console.log(`   âœ“ Participantes eliminados`);

        // PASO 8: FINALMENTE eliminar la liga
        console.log(`   ðŸ Paso 8: Eliminando la liga...`);
        await transactionalEntityManager.delete(League, leagueId);
        console.log(`   âœ“ Liga eliminada`);
      });

      console.log(
        `âœ… [deleteLeague] Liga ${leagueId} eliminada exitosamente con todas sus dependencias`,
      );
      return { success: true, message: 'Liga eliminada correctamente' };
    } catch (error: any) {
      console.error('âŒ [deleteLeague] Error FATAL eliminando liga:', error);
      console.error('   Stack:', error.stack);
      console.error('   Code:', error.code);
      console.error('   Detail:', error.detail);

      if (error.code === '23503') {
        // ForeignKeyViolation
        throw new BadRequestException(
          `No se puede eliminar: Esta liga tiene datos vinculados en la tabla '${error.table || 'desconocida'}'. ` +
            `Detalle: ${error.detail || error.message}`,
        );
      }

      throw new BadRequestException(
        `Error al eliminar liga: ${error.message}. ` +
          `Si el problema persiste, contacta al administrador.`,
      );
    }
  }

  async toggleBlockStatus(leagueId: string, userId: string, userRole: string) {
    const league = await this.leaguesRepository.findOne({
      where: { id: leagueId },
      relations: ['creator'],
    });

    if (!league) {
      throw new NotFoundException(`Liga con ID ${leagueId} no encontrada`);
    }

    // Check permissions: Only SUPER_ADMIN or League Admin (Creator)
    if (userRole !== 'SUPER_ADMIN' && league.creator.id !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para bloquear/desbloquear esta liga',
      );
    }

    // Toggle status
    if (league.status === LeagueStatus.LOCKED) {
      league.status = LeagueStatus.ACTIVE;
    } else {
      league.status = LeagueStatus.LOCKED;
    }

    await this.leaguesRepository.save(league);
    return league;
  }

  async getParticipantDetails(
    leagueId: string,
    requesterId: string,
    targetUserId: string,
  ) {
    const requester = await this.leagueParticipantsRepository.findOne({
      where: { league: { id: leagueId }, user: { id: requesterId } },
    });

    if (!requester?.isAdmin) {
      throw new ForbiddenException(
        'Solo el administrador de la liga puede ver los detalles.',
      );
    }

    // Predicciones
    const predictions = await this.userRepository.manager.query(
      `
      SELECT 
        p.id, p.home_score as "homeScore", p.away_score as "awayScore", p.points,
        m.date, m.status, 
        m.score_h as "matchScoreH", m.score_a as "matchScoreA",
        t1.name as "homeTeam", t1.flag_url as "homeFlag",
        t2.name as "awayTeam", t2.flag_url as "awayFlag"
      FROM predictions p
      JOIN matches m ON m.id = p.match_id
      LEFT JOIN teams t1 ON t1.id = m.home_team_id
      LEFT JOIN teams t2 ON t2.id = m.away_team_id
      WHERE p.user_id = $1
      ORDER BY m.date DESC
    `,
      [targetUserId],
    );

    // Bonus
    const bonusAnswers = await this.userRepository.manager.query(
      `
      SELECT 
        uba.id, uba.answer, uba.points_earned as "pointsEarned", 
        bq.text as "questionText", bq.points as "maxPoints", bq.correct_answer as "correctAnswer"
      FROM user_bonus_answers uba
      JOIN bonus_questions bq ON bq.id = uba.question_id
      WHERE uba.user_id = $1 AND (bq.league_id = $2 OR bq.league_id IS NULL)
    `,
      [targetUserId, leagueId],
    );

    return { predictions, bonusAnswers };
  }

  async getLeagueVoucher(leagueId: string): Promise<Buffer> {
    const transaction = await this.transactionsService.findByLeagueId(leagueId);

    if (!transaction) {
      throw new NotFoundException(
        'No se encontrÃ³ una transacciÃ³n para esta liga',
      );
    }

    if (!transaction.user || !transaction.league) {
      // Ensure relations are loaded. findByLeagueId should handle this.
      throw new NotFoundException('Datos de transacciÃ³n incompletos');
    }

    return this.pdfService.generateVoucher(
      transaction,
      transaction.user,
      transaction.league,
    );
  }

  async updateTieBreaker(leagueId: string, userId: string, guess: number) {
    const participant = await this.leagueParticipantsRepository.findOne({
      where: { league: { id: leagueId }, user: { id: userId } },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant of this league.');
    }

    participant.tieBreakerGuess = guess;
    return this.leagueParticipantsRepository.save(participant);
  }
  async getAnalyticsSummary(leagueId: string) {
    try {
      // 1. Get real-time calculated ranking (includes updated points from predictions)
      // This solves the issue of stale data in DB (0 points)
      const ranking = await this.getLeagueRanking(leagueId);

      const totalParticipants = ranking.length;
      const activeParticipants = ranking.filter(
        (r) => r.totalPoints > 0,
      ).length;

      // Calculate global average
      const sumTotal = ranking.reduce((acc, r) => acc + r.totalPoints, 0);
      const averagePoints =
        totalParticipants > 0
          ? (sumTotal / totalParticipants).toFixed(1)
          : '0.0';

      // 2. Group by Department in Memory
      const deptMap = new Map<string, { total: number; count: number }>();

      ranking.forEach((r) => {
        // @ts-ignore - Property 'department' comes from our modified getLeagueRanking returning extended object
        const dept = r.department || 'General';
        const current = deptMap.get(dept) || { total: 0, count: 0 };
        current.total += r.totalPoints;
        current.count += 1;
        deptMap.set(dept, current);
      });

      // 3. Transform to Array and Sort
      const departmentRanking = Array.from(deptMap.entries())
        .map(([department, stats]) => ({
          department,
          avgPoints: (stats.total / stats.count).toFixed(1),
          members: stats.count,
        }))
        .sort((a, b) => parseFloat(b.avgPoints) - parseFloat(a.avgPoints));

      return {
        totalParticipants,
        activeParticipants,
        zombieParticipants: Math.max(0, totalParticipants - activeParticipants),
        averagePoints,
        departmentRanking,
      };
    } catch (error) {
      console.error('Error in getAnalyticsSummary:', error);
      // Return empty structure on error to prevent UI crash
      return {
        totalParticipants: 0,
        activeParticipants: 0,
        zombieParticipants: 0,
        averagePoints: '0.0',
        departmentRanking: [],
      };
    }
  }

  async exportParticipants(leagueId: string) {
    return this.leagueParticipantsRepository.find({
      where: { league: { id: leagueId } },
      relations: ['user'],
      order: {
        totalPoints: 'DESC',
      },
    });
  }

  async getLeagueMatches(leagueId: string, userId?: string) {
    // Para ligas empresariales, retornar todos los partidos del torneo correspondiente
    // con las predicciones del usuario si estÃ¡ autenticado

    const league = await this.leaguesRepository.findOne({
      where: { id: leagueId },
    });
    if (!league) {
      throw new NotFoundException('League not found');
    }

    const isGlobal = league.type === LeagueType.GLOBAL;
    const tournamentId = league.tournamentId || 'WC2026'; // Default to World Cup

    const matchesQuery = this.leaguesRepository.manager
      .getRepository(Match)
      .createQueryBuilder('match')
      .where('match.tournamentId = :tournamentId', { tournamentId })
      .orderBy('match.date', 'ASC');

    // Si hay userId, incluir sus predicciones
    if (userId) {
      if (isGlobal) {
        matchesQuery.leftJoinAndSelect(
          'match.predictions',
          'prediction',
          'prediction.userId = :userId AND prediction.leagueId IS NULL',
          { userId },
        );
      } else {
        matchesQuery.leftJoinAndSelect(
          'match.predictions',
          'prediction',
          'prediction.userId = :userId AND (prediction.leagueId = :leagueId OR prediction.leagueId IS NULL)',
          { userId, leagueId },
        );
      }
    }

    const matches = await matchesQuery.getMany();

    return matches.map((match) => {
      let finalPrediction = null;
      if (match.predictions?.length > 0) {
        finalPrediction = isGlobal
          ? match.predictions[0]
          : match.predictions.find((p) => p.leagueId === leagueId) ||
            match.predictions.find((p) => p.leagueId === null);
      }

      return {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeTeamPlaceholder: match.homeTeamPlaceholder,
        awayTeamPlaceholder: match.awayTeamPlaceholder,
        homeFlag: match.homeFlag,
        awayFlag: match.awayFlag,
        date: match.date,
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        phase: match.phase,
        group: match.group,
        stadium: match.stadium,
        bracketId: match.bracketId,
        nextMatchId: match.nextMatchId,
        prediction: finalPrediction
          ? {
              homeScore: finalPrediction.homeScore,
              awayScore: finalPrediction.awayScore,
              isJoker: finalPrediction.isJoker,
              points: finalPrediction.points || 0,
            }
          : null,
      };
    });
  }

  async getWoodenSpoon(leagueId: string) {
    return this.leagueParticipantsRepository
      .createQueryBuilder('lp')
      .leftJoinAndSelect('lp.user', 'user')
      .select([
        'lp.id',
        'lp.totalPoints',
        'user.id',
        'user.nickname',
        'user.fullName',
        'user.avatarUrl',
      ])
      .where('lp.league.id = :leagueId', { leagueId })
      .andWhere('lp.isBlocked = :isBlocked', { isBlocked: false })
      .orderBy('lp.totalPoints', 'ASC') // Orden ascendente para obtener el menor puntaje
      .limit(1) // Solo traer 1 registro
      .getOne();
  }

  // --- SOCIAL WALL METHODS ---

  async createComment(
    leagueId: string,
    userId: string,
    data: { content: string; imageUrl?: string },
  ) {
    const participant = await this.leagueParticipantsRepository.findOne({
      where: { league: { id: leagueId }, user: { id: userId } },
    });

    if (!participant)
      throw new ForbiddenException('No eres participante de esta liga');
    if (participant.isBlocked)
      throw new ForbiddenException('EstÃ¡s bloqueado en esta liga');

    const comment = this.leagueCommentsRepository.create({
      league: { id: leagueId },
      user: { id: userId },
      content: data.content,
      imageUrl: data.imageUrl,
      likes: [],
    });

    const savedComment = await this.leagueCommentsRepository.save(comment);

    return this.leagueCommentsRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });
  }

  async getComments(leagueId: string) {
    return this.leagueCommentsRepository.find({
      where: { league: { id: leagueId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await this.leagueCommentsRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comentario no encontrado');

    const likes = comment.likes || [];
    const index = likes.indexOf(userId);

    if (index === -1) {
      likes.push(userId);
    } else {
      likes.splice(index, 1);
    }

    comment.likes = likes;
    await this.leagueCommentsRepository.save(comment);
    return { likes: comment.likes.length, isLiked: index === -1 };
  }
}
