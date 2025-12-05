import { Injectable } from '@nestjs/common';
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
  ) { }

  calculatePoints(match: Match, prediction: Prediction): number {
    if ((match.status !== 'COMPLETED' && match.status !== 'FINISHED') || match.homeScore === null || match.awayScore === null) {
      return 0; // Match not completed or scores not available
    }

    let points = 0;
    const actualHomeScore = match.homeScore;
    const actualAwayScore = match.awayScore;
    const predictedHomeScore = prediction.homeScore;
    const predictedAwayScore = prediction.awayScore;

    // Rule 1: Acertar el resultado exacto (ej. 2-1) = 5 puntos
    if (actualHomeScore === predictedHomeScore && actualAwayScore === predictedAwayScore) {
      points += 5;
    }

    // Rule 2: Acertar ganador (o empate) y diferencia de goles (ej. Argentina gana 2-0, predigo 3-1. Gana Argentina por 2 goles) = 3 puntos
    // Check if the winner is correct (or it's a draw)
    const actualWinner = Math.sign(actualHomeScore - actualAwayScore);
    const predictedWinner = Math.sign(predictedHomeScore - predictedAwayScore);

    if (actualWinner === predictedWinner) {
      // Check if the goal difference is correct
      if (Math.abs(actualHomeScore - actualAwayScore) === Math.abs(predictedHomeScore - predictedAwayScore)) {
        if (points < 5) { // Only award if exact score wasn't already awarded
          points += 3;
        }
      } else {
        // Rule 3: Acertar ganador (o empate) sin diferencia de goles = 1 punto
        if (points < 3) { // Only award if rule 1 or 2 wasn't already awarded
          points += 1;
        }
      }
    }

    // Ensure points don't exceed 5 if multiple rules somehow apply incorrectly
    return Math.min(points, 5);
  }

  async calculatePointsForMatch(matchId: string): Promise<void> {
    const match = await this.matchesRepository.findOne({ where: { id: matchId } });
    if (!match) return;

    const predictions = await this.predictionsRepository.find({
      where: { match: { id: matchId } },
      relations: ['user'],
    });

    for (const prediction of predictions) {
      const points = this.calculatePoints(match, prediction);
      prediction.points = points;
      await this.predictionsRepository.save(prediction);
    }

    console.log(`Calculated points for ${predictions.length} predictions for match ${matchId}`);
  }
}
