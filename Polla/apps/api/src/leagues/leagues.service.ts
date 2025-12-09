import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { League } from '../database/entities/league.entity';
import { User } from '../database/entities/user.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
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
    private transactionsService: TransactionsService,
    private pdfService: PdfService,
  ) { }

  async createLeague(userId: string, createLeagueDto: CreateLeagueDto): Promise<League> {
    try {
      const { name, type, maxParticipants, accessCodePrefix, packageType } = createLeagueDto;

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
      const code = accessCodePrefix || this.generateCode();

      const league = this.leaguesRepository.create({
        name,
        type,
        maxParticipants,
        creator,
        accessCodePrefix: code,
        isPaid: packageType !== 'starter', // Assuming starter is free
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

  async getMetadata(leagueId: string): Promise<{ league: League; availableSlots: number }> {
    const league = await this.leaguesRepository.findOne({
      where: { id: leagueId },
      relations: ['participants', 'participants.user'],
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
      throw new NotFoundException(`League with ID ${leagueId} not found.`);
    }

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
      isAdmin: p.isAdmin,
      creatorName: p.league.creator.nickname || p.league.creator.fullName,
      participantCount: 0, // TODO: agregar conteo real si es necesario
    }));

    console.log('getMyLeagues - result:', JSON.stringify(result, null, 2));
    return result;
  }

  async getLeagueRanking(leagueId: string) {
    // Obtener IDs de participantes de la liga
    const participants = await this.leagueParticipantsRepository.find({
      where: { league: { id: leagueId } },
      relations: ['user'],
    });

    const userIds = participants
      .filter(p => !p.isBlocked)
      .map(p => p.user.id);

    if (userIds.length === 0) {
      return [];
    }

    // Calcular Total Goles Mundial (Real) para TieBreaker
    const { totalGoals } = await this.leaguesRepository.manager
      .createQueryBuilder('matches', 'm')
      .select('SUM(m.score_h + m.score_a)', 'totalGoals')
      .where("m.status IN ('FINISHED', 'COMPLETED')")
      .getRawOne();
    const realGoals = Number(totalGoals || 0);

    // Obtener puntos de predicciones y brackets
    const ranking = await this.userRepository.createQueryBuilder('user')
      .leftJoin('user.predictions', 'prediction')
      .leftJoin('prediction.match', 'm_pred') // Join con match para filtrar por status
      .leftJoin('user_brackets', 'bracket', 'bracket.userId = user.id AND (bracket.leagueId = :leagueId OR bracket.leagueId IS NULL)', { leagueId })
      .leftJoin('league_participants', 'lp', 'lp.user_id = user.id AND lp.league_id = :leagueId', { leagueId })
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

  async getAllLeagues() {
    const leagues = await this.leaguesRepository.find({
      relations: ['creator', 'participants'],
    });

    return leagues.map(league => ({
      id: league.id,
      name: league.name,
      code: league.accessCodePrefix,
      type: league.type,
      maxParticipants: league.maxParticipants,
      creator: {
        id: league.creator.id,
        nickname: league.creator.nickname || league.creator.fullName,
        avatarUrl: league.creator.avatarUrl,
      },
      participantCount: league.participants?.length || 0,
      brandingLogoUrl: league.brandingLogoUrl,
      prizeImageUrl: league.prizeImageUrl,
      prizeDetails: league.prizeDetails,
      welcomeMessage: league.welcomeMessage,
    }));
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
        throw new ForbiddenException('Solo el SUPER_ADMIN puede modificar el límite de participantes');
      }
      league.maxParticipants = updateLeagueDto.maxParticipants;
    }

    if (updateLeagueDto.brandingLogoUrl !== undefined) league.brandingLogoUrl = updateLeagueDto.brandingLogoUrl;
    if (updateLeagueDto.prizeImageUrl !== undefined) league.prizeImageUrl = updateLeagueDto.prizeImageUrl;
    if (updateLeagueDto.prizeDetails !== undefined) league.prizeDetails = updateLeagueDto.prizeDetails;
    if (updateLeagueDto.welcomeMessage !== undefined) league.welcomeMessage = updateLeagueDto.welcomeMessage;

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
      // Borrar dependencias manualmente en orden correcto (usando nombres de columna camelCase como en Entities)
      await manager.query(`DELETE FROM user_bonus_answers WHERE "questionId" IN (SELECT id FROM bonus_questions WHERE "leagueId" = $1)`, [leagueId]);
      await manager.query(`DELETE FROM bonus_questions WHERE "leagueId" = $1`, [leagueId]);
      await manager.query(`DELETE FROM user_brackets WHERE "leagueId" = $1`, [leagueId]);
      await manager.query(`DELETE FROM access_codes WHERE "leagueId" = $1`, [leagueId]);
      await manager.query(`DELETE FROM league_participants WHERE "leagueId" = $1`, [leagueId]);
      // Transactions (Optional, if exists)
      await manager.query(`DELETE FROM transactions WHERE "leagueId" = $1`, [leagueId]);

      await this.leaguesRepository.delete({ id: leagueId }); // Use delete instead of remove to be more direct
      return { message: 'Liga eliminada correctamente' };
    } catch (error: any) {
      console.error('❌ Error deleting league:', error);
      if (error.code === '23503') { // ForeignKeyViolation
        throw new BadRequestException(`No se puede eliminar: Esta liga tiene datos vinculados en la tabla '${error.table || 'desconocida'}'. Detalle: ${error.detail || error.message}`);
      }
      // Lanzar como BadRequest para que el mensaje llegue al cliente en producción
      throw new BadRequestException(`Error DB al eliminar liga: ${error.message} - Code: ${error.code}`);
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
}
