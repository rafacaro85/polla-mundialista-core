import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { Match } from '../database/entities/match.entity';
import { User } from '../database/entities/user.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { LeagueParticipantStatus } from '../database/enums/league-participant-status.enum';

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

      if (participant && (participant.isBlocked || participant.status === LeagueParticipantStatus.PENDING)) {
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

    // Check if match has started or is manually locked
    if (match.isManuallyLocked || match.date < new Date()) {
      throw new BadRequestException(
        match.isManuallyLocked 
          ? 'Match is locked by administrator' 
          : 'Cannot predict on a match that has already started',
      );
    }

    // JOKER LOGIC: Only one joker per phase allowed PER LEAGUE context.
    // We must ensure that if we set a joker here, any other joker visible in this league (Global or Local) is disabled.
    if (isJoker) {
      // Find ALL active jokers for this user/phase that are visible in this league (Unique Joker Rule)
      const previousJokers = await this.predictionsRepository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.match', 'match')
        .where('p.userId = :userId', { userId })
        .andWhere('p.isJoker = :isJoker', { isJoker: true })
        .andWhere('match.phase = :phase', { phase: match.phase })
        .andWhere(
          leagueId
            ? '(p.leagueId = :leagueId OR p.leagueId IS NULL)'
            : 'p.leagueId IS NULL',
          { leagueId },
        )
        .getMany();

      for (const joker of previousJokers) {
        // If it's a DIFFERENT match, we must deactivate the joker.
        if (joker.match.id !== matchId) {
          if (joker.leagueId === null && leagueId) {
            // CASE: Disabling a GLOBAL Joker inside a Specific League.
            // We cannot modify the global record directly (it would affect other leagues).
            // Instead, we create a LOCAL OVERRIDE for that match with isJoker=false.

            // Check if an override already exists (unlikely if we just fetched jokers, but safe to check)
            const existingOverride = await this.predictionsRepository.findOne({
              where: {
                user: { id: userId },
                match: { id: joker.match.id },
                leagueId,
              },
            });

            if (existingOverride) {
              existingOverride.isJoker = false;
              await this.predictionsRepository.save(existingOverride);
            } else {
              // Create new override copying values but disabling joker
              const override = this.predictionsRepository.create({
                user: { id: userId } as User,
                match: { id: joker.match.id } as Match,
                leagueId: leagueId,
                homeScore: joker.homeScore,
                awayScore: joker.awayScore,
                isJoker: false, // Disabled locally
              });
              await this.predictionsRepository.save(override);
            }
          } else {
            // CASE: Local joker or Global context edit. Just update the record.
            joker.isJoker = false;
            await this.predictionsRepository.save(joker);
          }
        }
      }
    }

    let prediction = await this.predictionsRepository.findOne({
      where: {
        user: { id: userId },
        match: { id: matchId },
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
      prediction = this.predictionsRepository.create({
        user: { id: userId } as User,
        match: { id: matchId } as Match,
        leagueId: leagueId || undefined,
        tournamentId: match.tournamentId, // Inherit tournament context!
        homeScore,
        awayScore,
        isJoker: isJoker || false,
      });
    }

    const savedPrediction = await this.predictionsRepository.save(prediction);

    // --- SYNC TO GLOBAL CONTEXT (User Request) ---
    // Si se guardó una predicción en una liga específica (Empresa), replicamos el marcador
    // en el contexto Global (Social/Dashboard) para mantenerlos sincronizados.
    if (leagueId) {
      try {
        // Buscamos o creamos la predicción global
        let globalPrediction = await this.predictionsRepository.findOne({
          where: {
            user: { id: userId },
            match: { id: matchId },
            leagueId: IsNull(),
          },
        });

        if (globalPrediction) {
          // Si ya existe, actualizamos marcadores
          globalPrediction.homeScore = homeScore;
          globalPrediction.awayScore = awayScore;
          // FIX: No tocamos el Joker Global. Son estrategias independientes.
          await this.predictionsRepository.save(globalPrediction);
        } else {
          // Si no existe, la creamos (clonando la de la empresa, pero SIN joker)
          const newGlobal = this.predictionsRepository.create({
            user: { id: userId } as User,
            match: { id: matchId } as Match,
            leagueId: undefined, // Global
            tournamentId: match.tournamentId,
            homeScore,
            awayScore,
            isJoker: false, // Estrategia independiente
          });
          await this.predictionsRepository.save(newGlobal);
        }
      } catch (error) {
        console.warn(`⚠️ Error syncing prediction to global context: ${error.message}`);
        // No lanzamos error para no fallar el request original
      }
    }

    return savedPrediction;
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
        if (!lId || lId === 'null' || lId === 'undefined' || lId === 'global' || lId === '') {
            lId = null;
        }
        
        let tId = Array.isArray(tournamentId) ? tournamentId[0] : tournamentId;
        if (typeof tId === 'string' && tId.includes(',')) tId = tId.split(',')[0];
        if (!tId || tId === 'null' || tId === 'undefined' || tId === '') {
            tId = null;
        }

        console.log(`🚀 [CLEAR DEBUG] Normalizado -> User: ${userId} | League: ${lId} | Tournament: ${tId}`);
        
        // 2. Limpieza de Brackets
        try {
            await this.bracketsService.clearBracket(userId, lId || undefined, tId || undefined);
        } catch (e) {
            console.error('❌ Error en clearBracket:', e.message);
        }

        // 3. Limpieza de Marcadores (Scores)
        const allUserPredictions = await this.predictionsRepository.find({
            where: { user: { id: userId } },
            relations: ['match']
        });

        console.log(`📊 [CLEAR DEBUG] DB Total: ${allUserPredictions.length}. Filtros: T=${tId}, L=${lId}`);
        
        // Log sample to see what's in DB
        if (allUserPredictions.length > 0) {
            const sample = allUserPredictions[0];
            console.log(`📝 [CLEAR DEBUG] Sample DB Prediction: ID=${sample.id}, T=${sample.tournamentId}, L=${sample.leagueId}`);
        }

        const now = new Date();
        const toDelete = allUserPredictions.filter(p => {
            // 1. Torneo: Revisamos tanto en la predicción como en el partido asociado
            const predTid = p.tournamentId;
            const matchTid = p.match?.tournamentId;
            
            if (tId) {
                // Si el torneo no coincide en NINGUNA de las dos fuentes, lo descartamos
                if (predTid !== tId && matchTid !== tId) return false;
            }
            
            // 2. Liga: Debe coincidir exactamente (null para Global)
            const pLid = p.leagueId || null;
            if (lId !== pLid) return false;

            // 3. Tiempo: Solo borrar si el partido es futuro
            // Si no hay fecha o no hay partido, permitimos borrar por seguridad
            if (p.match?.date) {
                const matchDate = new Date(p.match.date);
                if (matchDate < now) return false;
            }

            return true;
        });

        console.log(`🔥 [CLEAR DEBUG] ${toDelete.length} marcadores pasan los filtros.`);
        
        // Log details if nothing found to delete but there are predictions
        if (toDelete.length === 0 && allUserPredictions.length > 0) {
            console.log('🔍 [CLEAR DEBUG] ¿Por qué no se borró nada?');
            allUserPredictions.slice(0, 3).forEach(p => {
                console.log(`   - Pred ID: ${p.id} | T_Pred: ${p.tournamentId} | T_Match: ${p.match?.tournamentId} | League: ${p.leagueId}`);
            });
        }

        if (toDelete.length > 0) {
            const ids = toDelete.map(p => p.id);
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
        throw new InternalServerErrorException(`Fallo crítico al limpiar: ${error.message}`);
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
                    isJoker: false // Default to false for independent strategy
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
}
