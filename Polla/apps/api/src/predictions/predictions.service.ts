import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { Match } from '../database/entities/match.entity';
import { User } from '../database/entities/user.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';

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

      if (participant && participant.isBlocked) {
        throw new ForbiddenException(
          'No puedes realizar predicciones porque estás bloqueado en esta liga.',
        );
      }
    }

    const match = await this.matchesRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Check if match has started
    if (match.date < new Date()) {
      throw new BadRequestException(
        'Cannot predict on a match that has already started',
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

    return this.predictionsRepository.save(prediction);
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

    return qb.getMany();
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
    leagueId?: string,
    tournamentId?: string,
  ) {
    // 1. Limpiar el Bracket (llaves eliminatorias)
    await this.bracketsService.clearBracket(userId, leagueId, tournamentId);
    console.log(
      `🧹 Bracket para usuario ${userId}, liga ${leagueId} y torneo ${tournamentId} limpiado.`,
    );

    // 2. Limpiar predicciones de partidos (Scores)
    const where: any = { user: { id: userId } };
    where.leagueId = leagueId ? leagueId : IsNull();
    if (tournamentId) {
      where.tournamentId = tournamentId;
    }

    // Solo borrar partidos que no han empezado
    const predictions = await this.predictionsRepository.find({
      where,
      relations: ['match'],
    });

    const toDelete = predictions.filter(
      (p) => !p.match.date || p.match.date > new Date(),
    );

    if (toDelete.length > 0) {
      await this.predictionsRepository.remove(toDelete);
    }

    return {
      message: `Sistema de predicciones reseteado para ${tournamentId || 'todos'}: Bracket borrado y ${toDelete.length} marcadores eliminados.`,
      count: toDelete.length,
    };
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

        // Check Time Validation
        if (match.date < now) continue; // Match ya empezó

        const lid = dto.leagueId || null; // Normalizar undefined a null para lógica interna
        const key = `${dto.matchId}_${lid || 'null'}`;

        let prediction = predictionsMap.get(key);

        if (prediction) {
          // Update existente
          prediction.homeScore = dto.homeScore;
          prediction.awayScore = dto.awayScore;
          if (dto.isJoker !== undefined) prediction.isJoker = dto.isJoker;
        } else {
          // Create nuevo
          prediction = queryRunner.manager.create(Prediction, {
            user: { id: userId } as User,
            match: { id: dto.matchId } as Match,
            leagueId: dto.leagueId || undefined, // TypeORM prefiere undefined a null para columnas opcionales a veces
            tournamentId: match.tournamentId, // Inherit tournamentId
            homeScore: dto.homeScore,
            awayScore: dto.awayScore,
            isJoker: dto.isJoker || false,
          });
        }
        entitiesToSave.push(prediction);
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
