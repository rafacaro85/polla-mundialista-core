import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from '../database/enums/transaction-status.enum';
import { PdfService } from '../common/pdf/pdf.service';

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
  ) { }

  async createLeague(userId: string, createLeagueDto: CreateLeagueDto): Promise<League> {
    try {
      const { name, type, maxParticipants, accessCodePrefix, packageType, isEnterprise, companyName } = createLeagueDto;

      console.log('--- CREATE LEAGUE DEBUG ---');
      console.log('Package Type:', packageType);
      console.log('Calculated isPaid:', packageType === 'starter' || packageType === 'FREE');
      console.log('---------------------------');

      // Validate maxUsers based on packageType
      // This is a basic validation, you might want to move this to a config or constant
      if (packageType === 'starter' && maxParticipants > 3) {
        throw new BadRequestException('El plan Starter solo permite hasta 3 participantes.');
      }
      // Add more validations for other plans if needed

      // Si es tipo 'VIP' (máx 5)
      if (type === LeagueType.VIP && maxParticipants > 5) {
        throw new BadRequestException('Las ligas VIP no pueden tener más de 5 participantes.');
      }

      const creator = await this.userRepository.findOne({ where: { id: userId } });
      if (!creator) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      // Generar código automático si no se proporciona
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
        isPaid: ['familia', 'starter', 'FREE'].includes(packageType),
        packageType,
        isEnterprise: !!isEnterprise,
        companyName: companyName,
      });

      const savedLeague = await this.leaguesRepository.save(league);

      // Create Transaction only for FREE plans
      if (['familia', 'starter', 'FREE'].includes(packageType)) {
        await this.transactionsService.createTransaction(
          creator,
          0,
          packageType,
          savedLeague.id,
          TransactionStatus.PAID
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
      throw new InternalServerErrorException('Failed to create league.', error.message);
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
    // 1. Limpiar nombre: Mayúsculas y solo letras/números
    const cleanName = companyName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ''); // Eliminar espacios y símbolos

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

  async getMetadata(leagueId: string): Promise<{ league: League; availableSlots: number }> {
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

    console.log(`[DEBUG] League Details ${leagueId}: Found ${league.participants?.length || 0} participants`);

    // Check if user is blocked
    if (userId) {
      const requester = league.participants.find(p => p.user.id === userId);
      if (requester?.isBlocked) {
        throw new ForbiddenException('Has sido bloqueado de esta liga por el administrador.');
      }
    }

    // Map participants to include user info
    const participants = league.participants.map(p => ({
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

  async getGlobalRanking() {
    // 1. Obtener todos los usuarios
    const users = await this.userRepository.find({
      select: ['id', 'nickname', 'fullName', 'avatarUrl'],
    });

    if (!users || users.length === 0) return [];

    const userIds = users.map(u => u.id);

    // 2. Fetch Prediction Points (Global - Máximo por partido entre todas las ligas)
    const predictionPointsRows = await this.predictionRepository.manager.query(`
      SELECT "userId", SUM(match_points) as points
      FROM (
        SELECT "userId", "matchId", MAX(points) as match_points
        FROM predictions
        WHERE "userId" = ANY($1)
        GROUP BY "userId", "matchId"
      ) as sub
      GROUP BY "userId"
    `, [userIds]);

    const predMap = new Map(predictionPointsRows.map(r => [r.userId || r.userid, Number(r.points || 0)]));

    // 3. Fetch Bracket Points (Global - Máximo por bracket entre todas las ligas)
    const bracketPointsRows = await this.userRepository.manager.query(`
      SELECT "userId", SUM(bracket_points) as points
      FROM (
        SELECT "userId", "leagueId", MAX(points) as bracket_points
        FROM user_brackets
        WHERE "userId" = ANY($1)
        GROUP BY "userId", "leagueId"
      ) as sub
      GROUP BY "userId"
    `, [userIds]);

    const bracketMap = new Map(bracketPointsRows.map(r => [r.userId || r.userid, Number(r.points || 0)]));

    // 4. Fetch Bonus Points (Global)
    const bonusPointsRows = await this.userRepository.manager.createQueryBuilder(UserBonusAnswer, 'uba')
      .innerJoin('uba.question', 'bq')
      .select('uba.userId', 'userId')
      .addSelect('SUM(uba.pointsEarned)', 'points')
      .where('uba.userId IN (:...userIds)', { userIds })
      // Eliminado el filtro bq.leagueId IS NULL
      .groupBy('uba.userId')
      .getRawMany();

    const bonusMap = new Map(bonusPointsRows.map(r => [r.userId || r.userid, Number(r.points || r.POINTS || 0)]));

    // 5. Combinar
    const finalRanking = users.map(u => {
      const predictionPoints = predMap.get(u.id) || 0;
      const bracketPoints = bracketMap.get(u.id) || 0;
      const bonusPoints = bonusMap.get(u.id) || 0;
      const totalPoints = predictionPoints + bracketPoints + bonusPoints;

      return {
        id: u.id,
        nickname: u.nickname || u.fullName?.split(' ')[0] || 'Usuario',
        avatarUrl: u.avatarUrl,
        predictionPoints,
        bracketPoints,
        bonusPoints,
        totalPoints,
      };
    });

    // 6. Ordenar
    finalRanking.sort((a, b) => b.totalPoints - a.totalPoints);

    return finalRanking.map((user, index) => ({
      position: index + 1,
      ...user,
    }));
  }

  async getAllLeagues() {
    console.log('🔍 getAllLeagues called');
    try {
      const leagues = await this.leaguesRepository.find({
        relations: ['creator', 'participants'],
        order: { name: 'ASC' }
      });

      console.log(`✅ Found ${leagues.length} leagues`);

      return leagues.map(l => ({
        id: l.id,
        name: l.name,
        code: l.accessCodePrefix || 'SIN-CODIGO',
        type: l.type,
        maxParticipants: l.maxParticipants,
        creator: {
          id: l.creator?.id,
          nickname: l.creator?.nickname || l.creator?.fullName || 'Desconocido',
          avatarUrl: l.creator?.avatarUrl
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
      console.error('❌ CRITICAL ERROR in getAllLeagues:', error);
      console.error('Error stack:', error.stack);
      throw new InternalServerErrorException(`Error al cargar ligas: ${error.message}`);
    }
  }

  async getMyLeagues(userId: string) {
    console.log('getMyLeagues - userId:', userId);
    const participants = await this.leagueParticipantsRepository.find({
      where: { user: { id: userId } },
      relations: ['league', 'league.creator', 'league.participants'],
    });
    console.log('getMyLeagues - participants found:', participants.length);
    console.log('getMyLeagues - participants:', JSON.stringify(participants, null, 2));

    const result = participants.map(p => ({
      id: p.league.id,
      name: p.league.name,
      code: p.league.accessCodePrefix,
      type: p.league.type,
      isAdmin: p.isAdmin,
      creatorName: p.league.creator.nickname || p.league.creator.fullName,
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
      isPaid: p.league.isPaid,
      packageType: p.league.packageType,
    }));

    console.log('getMyLeagues - result:', JSON.stringify(result, null, 2));
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
      throw new ForbiddenException('No tienes permisos para ver los participantes de esta liga.');
    }

    return this.fetchParticipants(leagueId);
  }

  private async fetchParticipants(leagueId: string) {
    const participants = await this.leagueParticipantsRepository.find({
      where: { league: { id: leagueId } },
      relations: ['user'],
      order: { totalPoints: 'DESC' }
    });

    return participants.map(p => ({
      ...p,
      user: {
        id: p.user.id,
        nickname: p.user.nickname,
        fullName: p.user.fullName,
        email: p.user.email,
        avatarUrl: p.user.avatarUrl,
        phoneNumber: p.user.phoneNumber,
      },
      status: p.isBlocked ? 'BLOCKED' : 'ACTIVE'
    }));
  }

  async getLeagueForUser(leagueId: string, userId: string) {
    const participant = await this.leagueParticipantsRepository.findOne({
      where: { league: { id: leagueId }, user: { id: userId } },
      relations: ['league', 'league.creator', 'league.participants'],
    });

    if (!participant) {
      throw new NotFoundException('League not found or user is not a participant');
    }

    return {
      id: participant.league.id,
      name: participant.league.name,
      code: participant.league.accessCodePrefix,
      type: participant.league.type,
      isAdmin: participant.isAdmin,
      creatorName: participant.league.creator.nickname || participant.league.creator.fullName,
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
    };
  }

  async getLeagueRanking(leagueId: string) {
    const league = await this.leaguesRepository.findOne({ where: { id: leagueId } });
    if (!league) throw new NotFoundException('League not found');

    const participants = await this.leagueParticipantsRepository.find({
      where: { league: { id: leagueId } },
      relations: ['user'],
    });

    if (!participants || participants.length === 0) return [];

    const activeParticipants = participants.filter(p => !p.isBlocked);
    const userIds = activeParticipants.map(p => p.user.id);

    // Goles Reales para Tiebreaker
    const goalsResult = await this.leaguesRepository.manager.createQueryBuilder(Match, 'm')
      .select('SUM(COALESCE(m.homeScore, 0) + COALESCE(m.awayScore, 0))', 'total')
      .where("m.status IN ('FINISHED', 'COMPLETED')")
      .getRawOne();
    const realGoals = Number(goalsResult?.total || goalsResult?.TOTAL || 0);

    // Prediction Points (Improved to include Global Fallback)
    const isGlobal = league.type === LeagueType.GLOBAL;
    const allPredictions = await this.predictionRepository.createQueryBuilder('p')
      .innerJoin('p.match', 'm')
      .select(['p.userId', 'p.matchId', 'p.points', 'p.leagueId'])
      .where('p.userId IN (:...userIds)', { userIds })
      .andWhere(isGlobal ? 'p.leagueId IS NULL' : '(p.leagueId = :leagueId OR p.leagueId IS NULL)', { leagueId })
      .andWhere("m.status IN ('FINISHED', 'COMPLETED')")
      .getRawMany();

    // Map to keep track of points: { userId: { matchId: points } }
    // We prioritize league-specific predictions over global fallback
    const userPointsMap = new Map<string, Map<string, number>>();

    allPredictions.forEach(r => {
      const uId = r.userId || r.userid || r.p_user_id;
      const mId = r.matchId || r.matchid || r.p_match_id;
      const points = Number(r.points || r.p_points || 0);
      const pLeagueId = r.leagueId || r.leagueid || r.p_league_id;

      if (!userPointsMap.has(uId)) {
        userPointsMap.set(uId, new Map());
      }

      const userMatches = userPointsMap.get(uId)!;

      // Si no existe predicción para este partido aún en el mapa, o la que hay es global y la nueva es específica de liga
      if (!userMatches.has(mId) || (pLeagueId === leagueId)) {
        userMatches.set(mId, points);
      }
    });

    const predMap = new Map<string, number>();
    userPointsMap.forEach((matchesMap, uId) => {
      let total = 0;
      matchesMap.forEach(pts => total += pts);
      predMap.set(uId, total);
    });

    // Bracket Points
    const bracketPointsRows = await this.userRepository.manager.createQueryBuilder(UserBracket, 'b')
      .select('b.userId', 'userId')
      .addSelect('MAX(b.points)', 'points')
      .where('b.userId IN (:...userIds)', { userIds })
      .andWhere('(b.leagueId = :leagueId OR b.leagueId IS NULL)', { leagueId })
      .groupBy('b.userId')
      .getRawMany();

    const bracketMap = new Map(bracketPointsRows.map(r => [r.userId || r.userid, Number(r.points || r.POINTS || 0)]));

    // Bonus Points
    const bonusPointsRows = await this.userRepository.manager.createQueryBuilder(UserBonusAnswer, 'uba')
      .innerJoin('uba.question', 'bq')
      .select('uba.userId', 'userId')
      .addSelect('SUM(uba.pointsEarned)', 'points')
      .where('uba.userId IN (:...userIds)', { userIds })
      .andWhere('bq.leagueId = :leagueId', { leagueId })
      .groupBy('uba.userId')
      .getRawMany();

    const bonusMap = new Map(bonusPointsRows.map(r => [r.userId || r.userid, Number(r.points || r.POINTS || 0)]));

    const finalRanking = activeParticipants.map(lp => {
      const uId = lp.user.id;
      const predictionPoints = predMap.get(uId) || 0;
      const bracketPoints = bracketMap.get(uId) || 0;
      const bonusPoints = bonusMap.get(uId) || 0;
      const triviaPoints = Number(lp.triviaPoints || 0);
      const totalPoints = predictionPoints + bracketPoints + bonusPoints + triviaPoints;
      const tieBreakerGuess = lp.tieBreakerGuess !== null && lp.tieBreakerGuess !== undefined ? Number(lp.tieBreakerGuess) : null;

      return {
        id: uId,
        nickname: lp.user.nickname || lp.user.fullName?.split(' ')[0] || 'Usuario',
        avatarUrl: lp.user.avatarUrl,
        predictionPoints,
        bracketPoints,
        bonusPoints,
        triviaPoints,
        totalPoints,
        tieBreakerGuess,
        tieBreakerDiff: tieBreakerGuess !== null ? Math.abs(tieBreakerGuess - realGoals) : Infinity
      };
    });

    finalRanking.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.tieBreakerDiff - b.tieBreakerDiff;
    });

    return finalRanking.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  }

  // --- ADMIN METHODS ---



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
        throw new ForbiddenException('Solo el SUPER_ADMIN puede modificar el límite de participantes');
      }
      league.maxParticipants = updateLeagueDto.maxParticipants;
    }

    if (updateLeagueDto.brandingLogoUrl !== undefined) league.brandingLogoUrl = updateLeagueDto.brandingLogoUrl;
    if (updateLeagueDto.prizeImageUrl !== undefined) league.prizeImageUrl = updateLeagueDto.prizeImageUrl;
    if (updateLeagueDto.prizeDetails !== undefined) league.prizeDetails = updateLeagueDto.prizeDetails;
    if (updateLeagueDto.welcomeMessage !== undefined) league.welcomeMessage = updateLeagueDto.welcomeMessage;
    if (updateLeagueDto.isEnterprise !== undefined) league.isEnterprise = updateLeagueDto.isEnterprise;
    if (updateLeagueDto.companyName !== undefined) league.companyName = updateLeagueDto.companyName;
    if (updateLeagueDto.brandColorPrimary !== undefined) league.brandColorPrimary = updateLeagueDto.brandColorPrimary;
    if (updateLeagueDto.brandColorSecondary !== undefined) league.brandColorSecondary = updateLeagueDto.brandColorSecondary;
    if (updateLeagueDto.brandColorBg !== undefined) league.brandColorBg = updateLeagueDto.brandColorBg;
    if (updateLeagueDto.brandColorText !== undefined) league.brandColorText = updateLeagueDto.brandColorText;
    if (updateLeagueDto.brandFontFamily !== undefined) league.brandFontFamily = updateLeagueDto.brandFontFamily;
    if (updateLeagueDto.brandCoverUrl !== undefined) league.brandCoverUrl = updateLeagueDto.brandCoverUrl;
    if (updateLeagueDto.enableDepartmentWar !== undefined) league.enableDepartmentWar = updateLeagueDto.enableDepartmentWar;

    if (updateLeagueDto.isEnterpriseActive !== undefined) {
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Solo el SUPER_ADMIN puede activar/desactivar el modo Enterprise.');
      }
      league.isEnterpriseActive = updateLeagueDto.isEnterpriseActive;
    }

    if (updateLeagueDto.isPaid !== undefined) {
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Solo el SUPER_ADMIN puede modificar el estado de pago.');
      }
      league.isPaid = updateLeagueDto.isPaid;
    }

    const updatedLeague = await this.leaguesRepository.save(league);

    console.log(`✅ [updateLeague] Liga actualizada: ${updatedLeague.name}`);
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
      throw new ForbiddenException('Solo el SUPER_ADMIN o el admin actual pueden transferir la propiedad');
    }

    // 3. Verificar que el nuevo admin es participante de la liga
    const newAdminParticipant = league.participants.find(p => p.user.id === newAdminId);

    if (!newAdminParticipant) {
      throw new BadRequestException('El nuevo administrador debe ser un participante de la liga');
    }

    // 4. Obtener el nuevo admin completo
    const newAdmin = await this.userRepository.findOne({ where: { id: newAdminId } });

    if (!newAdmin) {
      throw new NotFoundException(`Usuario con ID ${newAdminId} no encontrado`);
    }

    // 5. Actualizar el creador de la liga
    const oldAdminId = league.creator.id;
    league.creator = newAdmin;
    await this.leaguesRepository.save(league);

    // 6. Actualizar isAdmin en participants
    // Remover admin del anterior
    const oldAdminParticipant = league.participants.find(p => p.user.id === oldAdminId);
    if (oldAdminParticipant) {
      oldAdminParticipant.isAdmin = false;
      await this.leagueParticipantsRepository.save(oldAdminParticipant);
    }

    // Agregar admin al nuevo
    newAdminParticipant.isAdmin = true;
    await this.leagueParticipantsRepository.save(newAdminParticipant);

    console.log(`✅ [transferOwner] Propiedad transferida de ${oldAdminId} a ${newAdminId}`);

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
    console.log(`🔍 [deleteLeague] Verificando permisos...`);
    console.log(`   Creator ID: ${league.creator.id}`);
    console.log(`   Requester ID: ${userId}`);
    console.log(`   Requester Role: ${userRole}`);

    if (userRole !== 'SUPER_ADMIN' && league.creator.id !== userId) {
      console.error(`❌ [deleteLeague] Permiso denegado.`);
      throw new ForbiddenException('No tienes permisos para eliminar esta liga');
    }

    const manager = this.leaguesRepository.manager;

    try {
      console.log(`🗑️ [deleteLeague] Iniciando eliminación nuclear de liga ${leagueId}...`);

      // EJECUCIÓN NUCLEAR: Usar transacción para eliminar TODO
      await manager.transaction(async (transactionalEntityManager) => {
        // PASO 1: Logging (Participants check)
        const participantsCount = await transactionalEntityManager.count(LeagueParticipant, {
          where: { league: { id: leagueId } }
        });
        console.log(`   📋 Paso 1: Encontrados ${participantsCount} participantes para eliminar.`);

        // NOTA: Las predicciones son globales, no se tocan.

        // PASO 2: Eliminar respuestas de bonus questions
        console.log(`   ⭐ Paso 2: Eliminando respuestas de bonus...`);
        // Primero buscamos las preguntas de esta liga
        const questions = await transactionalEntityManager.find(BonusQuestion, {
          where: { league: { id: leagueId } },
          select: ['id']
        });
        const questionIds = questions.map(q => q.id);

        if (questionIds.length > 0) {
          await transactionalEntityManager.delete(UserBonusAnswer, { questionId: In(questionIds) });
          console.log(`   ✓ Respuestas de bonus eliminadas (${questionIds.length} preguntas afectadas)`);
        } else {
          console.log(`   ✓ No hay respuestas de bonus para eliminar`);
        }

        // PASO 3: Eliminar bonus questions
        console.log(`   ⭐ Paso 3: Eliminando bonus questions...`);
        await transactionalEntityManager.delete(BonusQuestion, { league: { id: leagueId } });
        console.log(`   ✓ Bonus questions eliminadas`);

        // PASO 4: Eliminar brackets de usuarios
        console.log(`   🏆 Paso 4: Eliminando brackets...`);
        await transactionalEntityManager.delete(UserBracket, { league: { id: leagueId } });
        console.log(`   ✓ Brackets eliminados`);

        // PASO 5: Eliminar códigos de acceso
        console.log(`   🔑 Paso 5: Eliminando códigos de acceso...`);
        await transactionalEntityManager.delete(AccessCode, { league: { id: leagueId } });
        console.log(`   ✓ Códigos de acceso eliminados`);

        // PASO 6: Eliminar transacciones/pagos
        console.log(`   💳 Paso 6: Eliminando transacciones...`);
        await transactionalEntityManager.delete(Transaction, { league: { id: leagueId } });
        console.log(`   ✓ Transacciones eliminadas`);

        // PASO 7: Eliminar participantes de la liga
        console.log(`   👥 Paso 7: Eliminando participantes...`);
        await transactionalEntityManager.delete(LeagueParticipant, { league: { id: leagueId } });
        console.log(`   ✓ Participantes eliminados`);

        // PASO 8: FINALMENTE eliminar la liga
        console.log(`   🏁 Paso 8: Eliminando la liga...`);
        await transactionalEntityManager.delete(League, leagueId);
        console.log(`   ✓ Liga eliminada`);
      });

      console.log(`✅ [deleteLeague] Liga ${leagueId} eliminada exitosamente con todas sus dependencias`);
      return { success: true, message: 'Liga eliminada correctamente' };

    } catch (error: any) {
      console.error('❌ [deleteLeague] Error FATAL eliminando liga:', error);
      console.error('   Stack:', error.stack);
      console.error('   Code:', error.code);
      console.error('   Detail:', error.detail);

      if (error.code === '23503') { // ForeignKeyViolation
        throw new BadRequestException(
          `No se puede eliminar: Esta liga tiene datos vinculados en la tabla '${error.table || 'desconocida'}'. ` +
          `Detalle: ${error.detail || error.message}`
        );
      }

      throw new BadRequestException(
        `Error al eliminar liga: ${error.message}. ` +
        `Si el problema persiste, contacta al administrador.`
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
      throw new ForbiddenException('No tienes permisos para bloquear/desbloquear esta liga');
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

  async getParticipantDetails(leagueId: string, requesterId: string, targetUserId: string) {
    const requester = await this.leagueParticipantsRepository.findOne({
      where: { league: { id: leagueId }, user: { id: requesterId } }
    });

    if (!requester?.isAdmin) {
      throw new ForbiddenException('Solo el administrador de la liga puede ver los detalles.');
    }

    // Predicciones
    const predictions = await this.userRepository.manager.query(`
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
    `, [targetUserId]);

    // Bonus
    const bonusAnswers = await this.userRepository.manager.query(`
      SELECT 
        uba.id, uba.answer, uba.points_earned as "pointsEarned", 
        bq.text as "questionText", bq.points as "maxPoints", bq.correct_answer as "correctAnswer"
      FROM user_bonus_answers uba
      JOIN bonus_questions bq ON bq.id = uba.question_id
      WHERE uba.user_id = $1 AND (bq.league_id = $2 OR bq.league_id IS NULL)
    `, [targetUserId, leagueId]);

    return { predictions, bonusAnswers };
  }

  async getLeagueVoucher(leagueId: string): Promise<Buffer> {
    const transaction = await this.transactionsService.findByLeagueId(leagueId);

    if (!transaction) {
      throw new NotFoundException('No se encontró una transacción para esta liga');
    }

    if (!transaction.user || !transaction.league) {
      // Ensure relations are loaded. findByLeagueId should handle this.
      throw new NotFoundException('Datos de transacción incompletos');
    }

    return this.pdfService.generateVoucher(transaction, transaction.user, transaction.league);
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
    const totalParticipants = await this.leagueParticipantsRepository.count({ where: { league: { id: leagueId } } });

    // Active: Users with at least one prediction
    const activeResult = await this.leagueParticipantsRepository.createQueryBuilder('lp')
      .select('COUNT(DISTINCT lp.user_id)', 'count')
      .innerJoin('predictions', 'p', 'p.user_id = lp.user_id')
      .where('lp.league_id = :leagueId', { leagueId })
      .getRawOne();

    const activeCount = parseInt(activeResult?.count || '0');

    // Average Points
    const avgResult = await this.leagueParticipantsRepository.createQueryBuilder('lp')
      .select('AVG(lp.total_points)', 'avg')
      .where('lp.league_id = :leagueId', { leagueId })
      .getRawOne();

    // Department Ranking
    const deptRanking = await this.leagueParticipantsRepository.createQueryBuilder('lp')
      .select('lp.department', 'department')
      .addSelect('AVG(lp.total_points)', 'avgPoints')
      .addSelect('COUNT(lp.id)', 'members')
      .where('lp.league_id = :leagueId', { leagueId })
      .andWhere('lp.department IS NOT NULL')
      .andWhere("lp.department != ''")
      .groupBy('lp.department')
      .orderBy('AVG(lp.total_points)', 'DESC')
      .addOrderBy('COUNT(lp.id)', 'DESC')
      .getRawMany();

    return {
      totalParticipants,
      activeParticipants: activeCount,
      zombieParticipants: Math.max(0, totalParticipants - activeCount),
      averagePoints: parseFloat(avgResult?.avg || '0').toFixed(1),
      departmentRanking: deptRanking.map(d => ({
        department: d.department,
        avgPoints: parseFloat(d.avgpoint || d.avgPoints || '0').toFixed(1), // Handle lowercase default alias
        members: parseInt(d.members || '0')
      }))
    };
  }

  async exportParticipants(leagueId: string) {
    return this.leagueParticipantsRepository.find({
      where: { league: { id: leagueId } },
      relations: ['user'],
      order: {
        totalPoints: 'DESC'
      }
    });
  }

  async getLeagueMatches(leagueId: string, userId?: string) {
    // Para ligas empresariales, retornar todos los partidos del torneo FIFA 2026
    // con las predicciones del usuario si está autenticado

    const league = await this.leaguesRepository.findOne({ where: { id: leagueId } });
    const isGlobal = league?.type === LeagueType.GLOBAL;

    const matchesQuery = this.leaguesRepository.manager
      .getRepository(Match)
      .createQueryBuilder('match')
      .orderBy('match.date', 'ASC');

    // Si hay userId, incluir sus predicciones
    if (userId) {
      if (isGlobal) {
        matchesQuery.leftJoinAndSelect(
          'match.predictions',
          'prediction',
          'prediction.userId = :userId AND prediction.leagueId IS NULL',
          { userId }
        );
      } else {
        matchesQuery.leftJoinAndSelect(
          'match.predictions',
          'prediction',
          'prediction.userId = :userId AND (prediction.leagueId = :leagueId OR prediction.leagueId IS NULL)',
          { userId, leagueId }
        );
      }
    }

    const matches = await matchesQuery.getMany();

    return matches.map(match => {
      let finalPrediction = null;
      if (match.predictions?.length > 0) {
        finalPrediction = isGlobal
          ? match.predictions[0]
          : (match.predictions.find(p => p.leagueId === leagueId) || match.predictions.find(p => p.leagueId === null));
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
        prediction: finalPrediction ? {
          homeScore: finalPrediction.homeScore,
          awayScore: finalPrediction.awayScore,
          isJoker: finalPrediction.isJoker,
          points: finalPrediction.points || 0
        } : null,
      };
    });
  }

  async getWoodenSpoon(leagueId: string) {
    return this.leagueParticipantsRepository
      .createQueryBuilder('lp')
      .leftJoinAndSelect('lp.user', 'user')
      .select(['lp.id', 'lp.totalPoints', 'user.id', 'user.nickname', 'user.fullName', 'user.avatarUrl'])
      .where('lp.league.id = :leagueId', { leagueId })
      .andWhere('lp.isBlocked = :isBlocked', { isBlocked: false })
      .orderBy('lp.totalPoints', 'ASC') // Orden ascendente para obtener el menor puntaje
      .limit(1) // Solo traer 1 registro
      .getOne();
  }

  // --- SOCIAL WALL METHODS ---

  async createComment(leagueId: string, userId: string, data: { content: string, imageUrl?: string }) {
    const participant = await this.leagueParticipantsRepository.findOne({
      where: { league: { id: leagueId }, user: { id: userId } }
    });

    if (!participant) throw new ForbiddenException('No eres participante de esta liga');
    if (participant.isBlocked) throw new ForbiddenException('Estás bloqueado en esta liga');

    const comment = this.leagueCommentsRepository.create({
      league: { id: leagueId },
      user: { id: userId },
      content: data.content,
      imageUrl: data.imageUrl,
      likes: []
    });

    return this.leagueCommentsRepository.save(comment);
  }

  async getComments(leagueId: string) {
    return this.leagueCommentsRepository.find({
      where: { league: { id: leagueId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 20
    });
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await this.leagueCommentsRepository.findOne({ where: { id: commentId } });
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

