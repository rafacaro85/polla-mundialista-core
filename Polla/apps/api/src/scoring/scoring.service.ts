import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(Prediction)
    private predictionsRepository: Repository<Prediction>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Calcula los puntos obtenidos en una predicción.
   * Regla Acumulativa (Max 7 puntos):
   * 1 (HomeGoal) + 1 (AwayGoal) + 2 (Sign) + 3 (Exact) = 7 Total
   */
  calculatePoints(match: Match, prediction: Prediction): number {
    if (
      (match.status !== 'COMPLETED' && match.status !== 'FINISHED') ||
      match.homeScore === null ||
      match.awayScore === null
    ) {
      return 0; // Match not completed or scores not available
    }

    let points = 0;
    const actualHomeScore = match.homeScore;
    const actualAwayScore = match.awayScore;
    const predictedHomeScore = prediction.homeScore;
    const predictedAwayScore = prediction.awayScore;

    // 1. Puntos por Goles Individuales (1 punto por cada equipo acertado)
    if (actualHomeScore === predictedHomeScore) points += 1;
    if (actualAwayScore === predictedAwayScore) points += 1;

    // 2. Puntos por Resultado (Ganador o Empate) (2 puntos)
    const actualSign = Math.sign(actualHomeScore - actualAwayScore);
    const predictedSign = Math.sign(predictedHomeScore - predictedAwayScore);
    if (actualSign === predictedSign) {
      points += 2;
    }

    // 3. Puntos por Marcador Exacto (3 puntos adicionales)
    // Nota: Si aciertas marcador exacto, implícitamente aciertas resultado y goles individuales.
    // Total posible: 1 + 1 + 2 + 3 = 7 puntos.
    if (
      actualHomeScore === predictedHomeScore &&
      actualAwayScore === predictedAwayScore
    ) {
      points += 3;
    }

    // 4. Comodín (Joker) - Doble Puntuación
    if (prediction.isJoker) {
      points *= 2;
    }

    return points;
  }

  async calculatePointsForMatch(matchId: string): Promise<void> {
    const match = await this.matchesRepository.findOne({
      where: { id: matchId },
    });
    if (!match) return;

    const predictions = await this.predictionsRepository.find({
      where: { match: { id: matchId } },
      relations: ['user'],
    });

    if (predictions.length === 0) return;

    // FIX C4: Scoring masivo en una única transacción
    // En lugar de hacer N saves individuales (N x 17ms), calculamos todo en memoria
    // y enviamos un solo batch a la base de datos.
    for (const prediction of predictions) {
      prediction.points = this.calculatePoints(match, prediction);
    }

    await this.predictionsRepository.manager.transaction(async (manager) => {
      // TypeORM manejará el chunking automáticamente si son demasiadas entidades
      await manager.save(Prediction, predictions);
    });

    console.log(
      `✅ [Scoring] Batch calculated and saved ${predictions.length} predictions for match ${matchId}`,
    );

    // Invalidación proactiva de caché de rankings afectados
    const leagueIds = [...new Set(predictions.filter(p => p.leagueId).map(p => p.leagueId))];
    for (const leagueId of leagueIds) {
      await this.cacheManager.del(`ranking:league:${leagueId}`);
    }
    await this.cacheManager.del(`ranking:global:${match.tournamentId}`);
  }
}
