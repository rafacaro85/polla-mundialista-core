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
        // Si es 'starter' (gratis), se considera pagado/activo. Si es Premium, empieza como NO pagado.
        isPaid: packageType === 'starter' || packageType === 'FREE',
        packageType, // <--- FALTABA ESTO
        isEnterprise: !!isEnterprise,
        companyName: companyName,
      });

      const savedLeague = await this.leaguesRepository.save(league);

      // Create Transaction only for FREE plans (starter)
      // Paid plans will have their transaction created via the frontend payment flow
      if (packageType === 'starter') {
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
    // Primero obtener puntos de predicciones y brackets
    // Primero obtener puntos de predicciones y brackets
    const ranking = await this.userRepository.createQueryBuilder('user')
      .leftJoin('user.predictions', 'prediction')
      .leftJoin('prediction.match', 'm_pred')
      .leftJoin('user_brackets', 'bracket', 'bracket.userId = user.id AND bracket.leagueId IS NULL')
      .select('user.id', 'id')
      .addSelect('user.nickname', 'nickname')
      .addSelect('user.fullName', 'fullName')
      .addSelect('user.avatarUrl', 'avatarUrl')
      .addSelect("COALESCE(SUM(CASE WHEN m_pred.status IN ('FINISHED', 'COMPLETED') THEN prediction.points ELSE 0 END), 0)", 'predictionPoints')
      .addSelect('COALESCE(MAX(bracket.points), 0)', 'bracketPoints')
      .groupBy('user.id')
      .addGroupBy('user.nickname')
      .addGroupBy('user.fullName')
      .addGroupBy('user.avatarUrl')
      .getRawMany();

    // Calcular bonus points por separado para CADA usuario usando QueryBuilder de Entidad
    // Esto asegura que los nombres de columnas se mapeen correctamente (camelCase vs snake_case)
    const finalRanking = await Promise.all(ranking.map(async (user) => {
      // Obtener bonus points solo de preguntas globales (sin leagueId)
      const bonusResult = await this.userRepository.manager
        .createQueryBuilder(UserBonusAnswer, 'uba')
        .leftJoin('uba.question', 'bq')
        .select('SUM(uba.pointsEarned)', 'bonusPoints')
        .where('uba.userId = :userId', { userId: user.id })
        .andWhere('bq.leagueId IS NULL')
        .getRawOne();

      const predictionPoints = Number(user.predictionPoints);
      const bracketPoints = Number(user.bracketPoints);
      const bonusPoints = Number(bonusResult?.bonusPoints || 0);
      const totalPoints = predictionPoints + bracketPoints + bonusPoints;

      return {
        id: user.id,
        nickname: user.nickname || user.fullName?.split(' ')[0] || 'Usuario',
        avatarUrl: user.avatarUrl,
        predictionPoints,
        bracketPoints,
        bonusPoints,
        totalPoints,
      };
    }));

    // Ordenar por puntos totales
    finalRanking.sort((a, b) => b.totalPoints - a.totalPoints);

    // Asignar posiciones
    return finalRanking.map((user, index) => ({
      position: index + 1,
      ...user,
    }));
  }

  async getAllLeagues() {
    console.log('🔍 getAllLeagues called');
    try {
      const leagues = await this.leaguesRepository.find({
        relations: ['creator'],
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
        participantCount: 0, // Temporarily hardcoded to 0
        isEnterprise: !!l.isEnterprise,
        isEnterpriseActive: !!l.isEnterpriseActive,
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
      relations: ['league', 'league.creator'],
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
      participantCount: 0,
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
      }
    }));
  }

  async getLeagueForUser(leagueId: string, userId: string) {
    const participant = await this.leagueParticipantsRepository.findOne({
      where: { league: { id: leagueId }, user: { id: userId } },
      relations: ['league', 'league.creator'],
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
      participantCount: 0, // Frontend handles calling ranking/participants separately if needed, or we could count here.
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
      // Additional fields needed for settings panel
      prizeImageUrl: participant.league.prizeImageUrl,
      prizeDetails: participant.league.prizeDetails,
      status: participant.league.status,
      isPaid: participant.league.isPaid,
      maxParticipants: participant.league.maxParticipants,
    };
  }

  async getLeagueRanking(leagueId: string) {
    // Obtener IDs de participantes de la liga
    const participants = await this.leagueParticipantsRepository.find({
      where: { league: { id: leagueId } },
      relations: ['user'],
    });

    console.log(`[DEBUG] Ranking League ${leagueId}: Found ${participants.length} participants`);

    const userIds = participants
      .filter(p => !p.isBlocked)
      .map(p => p.user.id);

    console.log(`[DEBUG] User IDs: ${userIds.join(', ')}`);

    if (userIds.length === 0) {
      console.log(`[DEBUG] No active participants found.`);
      return [];
    }

    // Calcular Total Goles Mundial (Real) para TieBreaker
    const { totalGoals } = await this.leaguesRepository.manager
      .createQueryBuilder(Match, 'm')
      .select('SUM(m.homeScore + m.awayScore)', 'totalGoals')
      .where("m.status IN ('FINISHED', 'COMPLETED')")
      .getRawOne();
    const realGoals = Number(totalGoals || 0);

    // Obtener puntos de predicciones y brackets
    const ranking = await this.userRepository.createQueryBuilder('user')
      .leftJoin('user.predictions', 'prediction')
      .leftJoin('prediction.match', 'm_pred')
      .leftJoin('user_brackets', 'bracket', 'bracket.userId = user.id AND (bracket.leagueId = :leagueId OR bracket.leagueId IS NULL)', { leagueId })
      .leftJoin('user.leagueParticipants', 'lp', 'lp.league = :leagueId', { leagueId })
      .select('user.id', 'id')
      .addSelect('user.nickname', 'nickname')
      .addSelect('user.fullName', 'fullName')
      .addSelect('user.avatarUrl', 'avatarUrl')
      // Sumar puntos SOLO si el partido está finalizado
      .addSelect("COALESCE(SUM(CASE WHEN m_pred.status IN ('FINISHED', 'COMPLETED') THEN prediction.points ELSE 0 END), 0)", 'predictionPoints')
      .addSelect('COALESCE(MAX(bracket.points), 0)', 'bracketPoints')
      .addSelect('COALESCE(MAX(lp.trivia_points), 0)', 'triviaPoints')
      .addSelect('MAX(lp.tie_breaker_guess)', 'tieBreakerGuess')
      .where('user.id IN (:...userIds)', { userIds })
      .groupBy('user.id')
      .addGroupBy('user.nickname')
      .addGroupBy('user.fullName')
      .addGroupBy('user.avatarUrl')
      .getRawMany();

    // Calcular bonus points por separado usando QueryBuilder de Entidad
    const finalRanking = await Promise.all(ranking.map(async (user) => {
      // Obtener bonus points solo de preguntas de esta liga
      const bonusResult = await this.userRepository.manager
        .createQueryBuilder(UserBonusAnswer, 'uba')
        .leftJoin('uba.question', 'bq')
        .select('SUM(uba.pointsEarned)', 'bonusPoints')
        .where('uba.userId = :userId', { userId: user.id })
        .andWhere('bq.leagueId = :leagueId', { leagueId })
        .getRawOne();

      const predictionPoints = Number(user.predictionPoints);
      const bracketPoints = Number(user.bracketPoints);
      const triviaPoints = Number(user.triviaPoints);
      const bonusPoints = Number(bonusResult?.bonusPoints || 0);
      const totalPoints = predictionPoints + bracketPoints + triviaPoints + bonusPoints;
      const tieBreakerGuess = user.tieBreakerGuess !== null ? Number(user.tieBreakerGuess) : null;

      return {
        id: user.id,
        nickname: user.nickname || user.fullName?.split(' ')[0] || 'Usuario',
        avatarUrl: user.avatarUrl,
        predictionPoints,
        bracketPoints,
        bonusPoints,
        triviaPoints,
        totalPoints,
        tieBreakerGuess,
        tieBreakerDiff: tieBreakerGuess !== null ? Math.abs(tieBreakerGuess - realGoals) : Infinity
      };
    }));

    // Ordenar por puntos totales DESC, luego por TieBreaker Diff ASC
    finalRanking.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      // Empate -> Usar TieBreaker
      return a.tieBreakerDiff - b.tieBreakerDiff;
    });

    // Asignar posiciones
    return finalRanking.map((user, index) => ({
      position: index + 1,
      ...user,
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

    const matchesQuery = this.leaguesRepository.manager
      .getRepository(Match)
      .createQueryBuilder('match')
      .orderBy('match.date', 'ASC');

    // Si hay userId, incluir sus predicciones
    if (userId) {
      matchesQuery
        .leftJoinAndSelect(
          'match.predictions',
          'prediction',
          'prediction.userId = :userId',
          { userId }
        );
    }

    const matches = await matchesQuery.getMany();

    // Formatear la respuesta
    return matches.map(match => ({
      id: match.id,
      homeTeam: match.homeTeam || match.homeTeamPlaceholder,
      awayTeam: match.awayTeam || match.awayTeamPlaceholder,
      date: match.date,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      phase: match.phase,
      group: match.group,
      stadium: match.stadium,
      prediction: match.predictions?.[0] ? {
        homeScore: match.predictions[0].homeScore,
        awayScore: match.predictions[0].awayScore,
        isJoker: match.predictions[0].isJoker,
        points: match.predictions[0].points,
      } : null,
    }));
  }
}
