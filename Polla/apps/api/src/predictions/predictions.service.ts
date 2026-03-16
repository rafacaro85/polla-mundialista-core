import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, DataSource } from 'typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { Match } from '../database/entities/match.entity';
import { User } from '../database/entities/user.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { LeagueParticipantStatus } from '../database/enums/league-participant-status.enum';
import { JokerConfig } from '../database/entities/joker-config.entity';

import { BracketsService } from '../brackets/brackets.service';

@Injectable()
export class PredictionsService {
  constructor(
    @InjectRepository(Prediction)
    private predictionsRepository: Repository<Prediction>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(LeagueParticipant)
    private leagueParticipantRepository: Repository<LeagueParticipant>,
    private bracketsService: BracketsService,
    private dataSource: DataSource,
  ) {}

  async upsertPrediction(
    userId: string,
    matchId: string,
    homeScore: number,
    awayScore: number,
    leagueId?: string,
    isJoker?: boolean,
  ): Promise<Prediction> {
    // 1. Check if user is blocked in the league (if leagueId is provided)
    if (leagueId) {
      const participant = await this.leagueParticipantRepository.findOne({
        where: {
          user: { id: userId },
          league: { id: leagueId },
        },
      });

      if (
        participant &&
        (participant.isBlocked ||
          participant.status === LeagueParticipantStatus.PENDING ||
          participant.status === LeagueParticipantStatus.PENDING_PAYMENT)
      ) {
        throw new ForbiddenException(
          'No puedes realizar predicciones porque tu estado es PENDIENTE o BLOQUEADO en esta liga.',
        );
      }
    }

    const match = await this.matchesRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const BLOCKED_STATUSES = ['FINISHED', 'LIVE', 'PST', 'CANC', 'ABD'];

    if (BLOCKED_STATUSES.includes(match.status)) {
      throw new BadRequestException(
        `No se pueden hacer predicciones. Estado del partido: ${match.status}`,
      );
    }

    // Check if match has started or is manually locked
    if (match.isManuallyLocked || match.date < new Date()) {
      throw new BadRequestException(
        match.isManuallyLocked
          ? 'Match is locked by administrator'
          : 'Cannot predict on a match that has already started',
      );
    }

    // -------------------------------------------------------------------------
    // FIX C3 — Race Condition: Pessimistic Locking (SELECT FOR UPDATE)
    // Toda la lógica del Joker + guardado de predicción corre dentro de una
    // transacción atómica. Si dos requests llegan simultáneamente para el mismo
    // usuario/fase, el segundo esperará hasta que el primero libere el lock,
    // garantizando que solo un Joker pueda activarse por usuario/fase/liga.
    // -------------------------------------------------------------------------
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedPrediction: Prediction;

    try {
      // JOKER LOGIC: Verify limits from joker_config table
      if (isJoker) {
        let phaseQueried = match.phase || null;
        if (match.tournamentId === 'WC2026' && match.phase && match.phase.startsWith('GROUP')) {
          phaseQueried = 'GROUP';
        }

        // Hierarchy lookup for configs
        const configs = await queryRunner.manager.find(JokerConfig, {
          where: { tournamentId: match.tournamentId }
        });

        let config = configs.find(c => c.phase === phaseQueried && c.group === match.group);
        if (!config) config = configs.find(c => c.phase === phaseQueried && !c.group);
        if (!config) config = configs.find(c => !c.phase && c.group === match.group);
        if (!config) config = configs.find(c => !c.phase && !c.group);

        const maxJokers = config ? config.maxJokers : 1; 

        // Count existing jokers
        // NOTE: We MUST NOT use .setLock('pessimistic_write') here because
        // TypeORM translates it to 'FOR UPDATE' which is not allowed with COUNT
        const query = queryRunner.manager
          .createQueryBuilder(Prediction, 'p')
          .innerJoin('p.match', 'm')
          .where('p.userId = :userId', { userId })
          .andWhere('p.isJoker = :isJoker', { isJoker: true })
          .andWhere('m.tournamentId = :tournamentId', { tournamentId: match.tournamentId })
          .andWhere('m.id != :currentMatchId', { currentMatchId: match.id }) // Use match.id (already validated as UUID)
          .andWhere(
            leagueId
              ? '(p.leagueId = :leagueId OR p.leagueId IS NULL)'
              : 'p.leagueId IS NULL',
            { leagueId },
          );

        // Apply same filters as config
        if (config?.phase) {
          if (config.phase === 'GROUP' && match.tournamentId === 'WC2026') {
            query.andWhere("m.phase LIKE 'GROUP%'");
          } else {
            query.andWhere('m.phase = :phase', { phase: config.phase });
          }
        }
        if (config?.group) {
          query.andWhere('m.group = :group', { group: config.group });
        }

        const currentActiveCount = await query.getCount();

        if (currentActiveCount >= maxJokers) {
          throw new BadRequestException(
            `Has alcanzado el límite de ${maxJokers} comodín(es) para esta fase/ronda.`
          );
        }
      }

      // Buscar predicción existente dentro de la transacción
      let prediction = await queryRunner.manager.findOne(Prediction, {
        where: {
          user: { id: userId },
          match: { id: match.id }, // Use match.id
          leagueId: leagueId ? leagueId : IsNull(),
        },
      });

      if (prediction) {
        prediction.homeScore = homeScore;
        prediction.awayScore = awayScore;
        if (isJoker !== undefined) prediction.isJoker = isJoker;
        // Ensure tournamentId is kept in sync (self-healing for legacy data)
        prediction.tournamentId = match.tournamentId;
      } else {
        prediction = queryRunner.manager.create(Prediction, {
          user: { id: userId } as User,
          match: { id: matchId } as Match,
          leagueId: leagueId || undefined,
          tournamentId: match.tournamentId, // Inherit tournament context!
          homeScore,
          awayScore,
          isJoker: isJoker || false,
        });
      }

      savedPrediction = await queryRunner.manager.save(prediction);

      // --- SYNC TO GLOBAL CONTEXT (User Request) ---
      // Si se guardó una predicción en una liga específica (Empresa), replicamos el marcador
      // en el contexto Global (Social/Dashboard) para mantenerlos sincronizados.
      if (leagueId) {
        const globalPrediction = await queryRunner.manager.findOne(Prediction, {
          where: {
            user: { id: userId },
            match: { id: match.id }, // Use match.id
            leagueId: IsNull(),
          },
        });

        if (globalPrediction) {
          // Si ya existe, actualizamos marcadores
          globalPrediction.homeScore = homeScore;
          globalPrediction.awayScore = awayScore;
          // FIX: No tocamos el Joker Global. Son estrategias independientes.
          await queryRunner.manager.save(globalPrediction);
        } else {
          // Si no existe, la creamos (clonando la de la empresa, pero SIN joker)
          const newGlobal = queryRunner.manager.create(Prediction, {
            user: { id: userId } as User,
            match: { id: matchId } as Match,
            leagueId: undefined, // Global
            tournamentId: match.tournamentId,
            homeScore,
            awayScore,
            isJoker: false, // Estrategia independiente
          });
          await queryRunner.manager.save(newGlobal);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      console.error('ERROR upsertPrediction:', {
        message: error.message,
        stack: error.stack,
        query: error.query,
        detail: error.detail,
        code: error.code,
      });
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return savedPrediction!;
  }

  async findAllByUser(
    userId: string,
    leagueId?: string,
    tournamentId?: string,
  ): Promise<Prediction[]> {
    // Strategy: Return Global Predictions + League Specific Predictions.
    // Frontend/Consumer should handle the override logic (using leagueId to distinguish).
    // Or we can do it here: If we find a specific one, we return it. If not, return global.

    // Actually, returning both is safer so frontend knows which is which.
    // Query: UserID matched implies ownership.
    // LeagueID: Either Match the specific league OR match NULL (Global).

    const qb = this.predictionsRepository
      .createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.match', 'match')
      .where('prediction.userId = :userId', { userId });

    if (tournamentId) {
      // Basic isolation: Only show predictions for matches of this tournament
      // Since prediction inherits tournamentId, we can filter directly or via match
      qb.andWhere('prediction.tournamentId = :tournamentId', { tournamentId });
    }

    if (leagueId && leagueId !== 'global') {
      // Get Specific League OR Global
      qb.andWhere(
        '(prediction.leagueId = :leagueId OR prediction.leagueId IS NULL)',
        { leagueId },
      );
    } else {
      // Get ONLY Global
      qb.andWhere('prediction.leagueId IS NULL');
    }

    const predictions = await qb.getMany();

    if (leagueId && leagueId !== 'global') {
      // FIX CRITICO: Independencia de Comodines.
      // Si estamos en una liga específica, las predicciones Globales que se usan de relleno
      // NO deben traer su Joker activo, porque ese Joker pertenece a la estrategia Global.
      // El usuario debe activar su Joker explícitamente en la liga local si lo quiere usar.
      // Esto evita que aparezcan 2 jokers (uno global heredado + uno local).
      return predictions.map((p) => {
        if (p.leagueId === null) {
          p.isJoker = false;
        }
        return p;
      });
    }

    return predictions;
  }

  async removePrediction(userId: string, matchId: string, leagueId?: string) {
    const match = await this.matchesRepository.findOne({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Check if match has started
    if (match.date < new Date()) {
      throw new BadRequestException(
        'Cannot delete prediction for a match that has already started',
      );
    }

    const prediction = await this.predictionsRepository.findOne({
      where: {
        user: { id: userId },
        match: { id: matchId },
        leagueId: leagueId ? leagueId : IsNull(),
      },
    });

    if (prediction) {
      await this.predictionsRepository.remove(prediction);
    }

    return { message: 'Prediction deleted' };
  }

  async removeAllPredictions(
    userId: string,
    leagueId?: any,
    tournamentId?: any,
  ) {
    try {
      // 1. Normalización estricta de parámetros
      let lId = Array.isArray(leagueId) ? leagueId[0] : leagueId;
      if (typeof lId === 'string' && lId.includes(',')) lId = lId.split(',')[0];
      if (
        !lId ||
        lId === 'null' ||
        lId === 'undefined' ||
        lId === 'global' ||
        lId === ''
      ) {
        lId = null;
      }

      let tId = Array.isArray(tournamentId) ? tournamentId[0] : tournamentId;
      if (typeof tId === 'string' && tId.includes(',')) tId = tId.split(',')[0];
      if (!tId || tId === 'null' || tId === 'undefined' || tId === '') {
        tId = null;
      }

      console.log(
        `🚀 [CLEAR DEBUG] Normalizado -> User: ${userId} | League: ${lId} | Tournament: ${tId}`,
      );

      // 2. Limpieza de Brackets
      try {
        await this.bracketsService.clearBracket(
          userId,
          lId || undefined,
          tId || undefined,
        );
      } catch (e) {
        console.error('❌ Error en clearBracket:', e.message);
      }

      // 3. Limpieza de Marcadores (Scores)
      const allUserPredictions = await this.predictionsRepository.find({
        where: { user: { id: userId } },
        relations: ['match'],
      });

      console.log(
        `📊 [CLEAR DEBUG] DB Total: ${allUserPredictions.length}. Filtros: T=${tId}, L=${lId}`,
      );

      // Log sample to see what's in DB
      if (allUserPredictions.length > 0) {
        const sample = allUserPredictions[0];
        console.log(
          `📝 [CLEAR DEBUG] Sample DB Prediction: ID=${sample.id}, T=${sample.tournamentId}, L=${sample.leagueId}`,
        );
      }

      const now = new Date();
      const toDelete = allUserPredictions.filter((p) => {
        // 1. Torneo: Revisamos tanto en la predicción como en el partido asociado
        const predTid = p.tournamentId;
        const matchTid = p.match?.tournamentId;

        if (tId) {
          // Si el torneo no coincide en NINGUNA de las dos fuentes, lo descartamos
          if (predTid !== tId && matchTid !== tId) return false;
        }

        // 2. Liga:
        // - Si pLid coincide con lId: Borramos (es la predicción propia de la liga).
        // - Si pLid es NULL y lId NO es NULL: También borramos si el torneo coincide.
        //   Esto es CRÍTICO porque el sistema sincroniza marcadores a Global (null).
        //   Si no borramos el global, la UI lo seguirá mostrando como "heredado".
        const pLid = p.leagueId || null;

        const isExactMatch = lId === pLid;
        const isGlobalSyncOfThisTournament = lId !== null && pLid === null;

        if (!isExactMatch && !isGlobalSyncOfThisTournament) return false;

        // 3. Tiempo: Solo borrar si el partido es futuro
        // Si no hay fecha o no hay partido, permitimos borrar por seguridad
        if (p.match?.date) {
          const matchDate = new Date(p.match.date);
        }

        return true;
      });

      console.log(
        `🔥 [CLEAR DEBUG] ${toDelete.length} marcadores pasan los filtros.`,
      );

      // Log details if nothing found to delete but there are predictions
      if (toDelete.length === 0 && allUserPredictions.length > 0) {
        console.log('🔍 [CLEAR DEBUG] ¿Por qué no se borró nada?');
        allUserPredictions.slice(0, 3).forEach((p) => {
          console.log(
            `   - Pred ID: ${p.id} | T_Pred: ${p.tournamentId} | T_Match: ${p.match?.tournamentId} | League: ${p.leagueId}`,
          );
        });
      }

      if (toDelete.length > 0) {
        const ids = toDelete.map((p) => p.id);
        await this.predictionsRepository.delete(ids);
        console.log(`✅ [CLEAR DEBUG] Borrados IDs: ${ids.join(', ')}`);
      }

      return {
        success: true,
        message: `Limpieza completada: ${toDelete.length} marcadores eliminados.`,
        count: toDelete.length,
      };
    } catch (error) {
      console.error('🔥 [CLEAR DEBUG FATAL]:', error);
      throw new InternalServerErrorException(
        `Fallo crítico al limpiar: ${error.message}`,
      );
    }
  }
  async upsertBulkPredictions(
    userId: string,
    predictionsData: {
      matchId: string;
      homeScore: number;
      awayScore: number;
      leagueId?: string;
      isJoker?: boolean;
    }[],
  ): Promise<any> {
    if (!predictionsData.length) return [];

    const queryRunner =
      this.predictionsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener todos los partidos involucrados (Cache para validaciones)
      const matchIds = predictionsData.map((p) => p.matchId);
      const matches = await this.matchesRepository.find({
        where: { id: In(matchIds) },
        select: ['id', 'date', 'phase', 'tournamentId'],
      });
      const matchesMap = new Map(matches.map((m) => [m.id, m]));

      // 2. Obtener TODAS las predicciones existentes para este usuario y estos partidos (Bulk Fetch)
      // Esto elimina el problema N+1 del findOne dentro del loop.
      const uniqueLeagueIds = [
        ...new Set(predictionsData.map((p) => p.leagueId)),
      ]; // Incluye undefined

      // Construimos query para traer todo lo que coincida con (user + matchIds)
      // Filtramos en memoria por leagueId después o ajustamos la query.
      // Dado que userId es fijo, podemos traer todas las predicciones de estos partidos para este usuario.
      const existingPredictions = await queryRunner.manager.find(Prediction, {
        where: {
          user: { id: userId },
          match: { id: In(matchIds) },
        },
        relations: ['match'],
      });

      // Mapa para acceso rápido: key = matchId_leagueId
      const predictionsMap = new Map<string, Prediction>();
      existingPredictions.forEach((p) => {
        const key = `${p.match.id}_${p.leagueId || 'null'}`;
        predictionsMap.set(key, p);
      });

      // 3. Preparar Entidades para Guardar
      const entitiesToSave: Prediction[] = [];
      const now = new Date();

      for (const dto of predictionsData) {
        const match = matchesMap.get(dto.matchId);
        if (!match) continue; // Match no existe

        const BLOCKED_STATUSES = ['FINISHED', 'LIVE', 'PST', 'CANC', 'ABD'];
        if (BLOCKED_STATUSES.includes(match.status)) continue; // Partido bloqueado

        // Check Time Validation & Manual Lock
        if (match.isManuallyLocked || match.date < now) continue; // Match ya empezó o está bloqueado

        const lid = dto.leagueId || null; // Normalizar undefined a null para lógica interna
        const key = `${dto.matchId}_${lid || 'null'}`;

        let prediction = predictionsMap.get(key);

        if (prediction) {
          // Update existente
          // Update existente
          // ... (ya corregido antes) ...
          prediction.homeScore = dto.homeScore;
          prediction.awayScore = dto.awayScore;

          if (dto.isJoker !== undefined) {
            prediction.isJoker = dto.isJoker;
          }
        } else {
          // Create nuevo
          prediction = queryRunner.manager.create(Prediction, {
            user: { id: userId } as User,
            match: { id: dto.matchId } as Match,
            leagueId: dto.leagueId || undefined,
            tournamentId: match.tournamentId,
            homeScore: dto.homeScore,
            awayScore: dto.awayScore,
            isJoker: dto.isJoker || false,
          });
        }
        entitiesToSave.push(prediction);

        // --- SYNC GLOBAL (BULK) ---
        if (dto.leagueId) {
          // Check if user already has a DIFFERENT prediction in the batch targeting global context?
          // Usually not. But we need to check if global prediction already exists in DB to update it.
          // Since we fetched ALL predictions for this user/matches in step 2 (existingPredictions), we can check the Map.

          const globalKey = `${dto.matchId}_null`;
          let globalPred = predictionsMap.get(globalKey);

          if (globalPred) {
            // Update existing global - Sync SCORES ONLY
            globalPred.homeScore = dto.homeScore;
            globalPred.awayScore = dto.awayScore;
            // FIX: Do NOT sync Joker. Jokers must be independent per league/context.
          } else {
            // Create new global
            globalPred = queryRunner.manager.create(Prediction, {
              user: { id: userId } as User,
              match: { id: dto.matchId } as Match,
              leagueId: undefined, // Global
              tournamentId: match.tournamentId,
              homeScore: dto.homeScore,
              awayScore: dto.awayScore,
              isJoker: false, // Default to false for independent strategy
            });
            // Add to map
            predictionsMap.set(globalKey, globalPred);
          }

          // Add to save list
          if (!entitiesToSave.includes(globalPred)) {
            entitiesToSave.push(globalPred);
          }
        }
      }

      // 4. Guardar masivamente (Batch Save)
      // TypeORM divide esto en chunks automáticamente si es muy grande.
      // Usamos 'save' que maneja insert o update según si tiene ID.
      if (entitiesToSave.length > 0) {
        // Desactivamos Jokers globales si es necesario (Bulk logic simplified: no complex joker check for performance)
        // Si la data viene con isJoker=true, asumimos que el cliente sabe lo que hace.
        // Optimización: podríamos hacer un update masivo para borrar jokers viejos, pero asumiremos que la IA no manda jokers.

        await queryRunner.manager.save(entitiesToSave);
      }

      await queryRunner.commitTransaction();
      return { saved: entitiesToSave.length, message: 'Bulk save successful' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getPredictionsByLeagueAndMatch(
    leagueId: string,
    matchId: string,
    currentUserId?: string,
    search?: string,
    page: number = 1,
    limit: number = 25,
    sortBy: 'points' | 'name' = 'points'
  ) {
    // 1. Validate if the match is locked or finished
    const match = await this.matchesRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Partido no encontrado');
    }

    if (!match.isManuallyLocked && !['FINISHED', 'LIVE', 'COMPLETED'].includes(match.status)) {
      throw new ForbiddenException('Las predicciones de este partido aún no están disponibles');
    }

    // 2. Query participants (with optional search filter)
    const qb = this.leagueParticipantRepository
      .createQueryBuilder('lp')
      .leftJoinAndSelect('lp.user', 'user')
      .where('lp.league_id = :leagueId', { leagueId })
      .andWhere('lp.status = :status', { status: LeagueParticipantStatus.ACTIVE })
      .andWhere('lp.isBlocked = false');

    if (search) {
      qb.andWhere('user.fullName ILIKE :search', { search: `%${search}%` });
    }

    const participants = await qb.getMany();

    if (!participants.length) {
      return { data: [], total: 0, page, hasMore: false, currentUser: null };
    }

    const userIds = participants.map((p) => p.user.id);

    // Get predictions for these users in this match (league-specific or global fallback)
    const predictions = await this.predictionsRepository
      .createQueryBuilder('p')
      .leftJoin('p.user', 'user')
      .addSelect(['user.id'])
      .where('p.match = :matchId', { matchId })
      .andWhere('user.id IN (:...userIds)', { userIds })
      .andWhere('(p.leagueId = :leagueId OR p.leagueId IS NULL)', { leagueId })
      .orderBy('p.leagueId', 'DESC', 'NULLS LAST') // league-specific first
      .getMany();

    // Build a map: userId → best prediction (league-specific over global)
    const predMap = new Map<string, Prediction>();
    for (const pred of predictions) {
      if (!pred.user) continue; // safety check
      const uid = pred.user.id;
      if (!predMap.has(uid) || pred.leagueId === leagueId) {
        predMap.set(uid, pred);
      }
    }

    // Build final result for each participant
    const results = participants.map((p) => {
      const pred = predMap.get(p.user.id);
      return {
        userId: p.user.id,
        fullName: p.user.fullName,
        avatarUrl: p.user.avatarUrl ?? null,
        homeScore: pred?.homeScore ?? null,
        awayScore: pred?.awayScore ?? null,
        points: pred?.points ?? null,
        isJoker: pred?.isJoker ?? false,
        hasPrediction: !!pred,
      };
    });

    // Sorting
    if (sortBy === 'name') {
      results.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    } else {
      // Sort by points DESC. If points are null, treat as -1 or 0
      results.sort((a, b) => {
        const ptsA = a.points || 0;
        const ptsB = b.points || 0;
        return ptsB - ptsA;
      });
    }

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = results.slice(startIndex, startIndex + limit);

    const currentUserData = currentUserId ? results.find((r) => r.userId === currentUserId) || null : null;

    return {
      data: paginatedData,
      total,
      page,
      hasMore: startIndex + limit < total,
      currentUser: currentUserData,
    };
  }

  async getJokerStatus(userId: string, tournamentId: string, leagueId?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // 1. Obtener todas las configuraciones de comodines para el torneo
      const configs = await queryRunner.manager.find(JokerConfig, {
        where: { tournamentId },
      });

      // 2. Obtener todas las predicciones del usuario que son comodines para este torneo
      // NOTA: usamos leftJoinAndSelect (no innerJoin + leftJoinAndSelect que causa error en TypeORM)
      const query = queryRunner.manager
        .createQueryBuilder(Prediction, 'p')
        .leftJoinAndSelect('p.match', 'm')
        .where('p.userId = :userId', { userId })
        .andWhere('p.isJoker = :isJoker', { isJoker: true })
        .andWhere('m.tournamentId = :tournamentId', { tournamentId });

      if (leagueId) {
        query.andWhere('(p.leagueId = :leagueId OR p.leagueId IS NULL)', { leagueId });
      } else {
        query.andWhere('p.leagueId IS NULL');
      }

      const usedJokers = await query.getMany();

      const statusList = [];

      for (const config of configs) {
        // Contar cuantos de estos comodines aplican a esta config
        let count = 0;
        for (const p of usedJokers) {
          const m = p.match;
          if (!m) continue;

          let matchApplies = false;
          let mPhase = m.phase || '';
          if (m.tournamentId === 'WC2026' && mPhase.startsWith('GROUP')) mPhase = 'GROUP';

          if (config.phase && config.group) {
            matchApplies = mPhase === config.phase && m.group === config.group;
          } else if (config.phase) {
            matchApplies = mPhase === config.phase;
          } else if (config.group) {
            matchApplies = m.group === config.group;
          } else {
            matchApplies = true;
          }

          if (matchApplies) count++;
        }

        statusList.push({
          phase: config.phase || config.group || 'ALL',
          max: config.maxJokers,
          used: count,
          remaining: Math.max(0, config.maxJokers - count)
        });
      }

      return statusList;
    } finally {
      await queryRunner.release();
    }
  }
}
