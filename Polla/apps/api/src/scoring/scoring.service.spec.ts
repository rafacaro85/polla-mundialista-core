import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: 'MatchRepository', useValue: {} },
        { provide: 'PredictionRepository', useValue: {} },
        { provide: 'CACHE_MANAGER', useValue: {} },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  describe('calculatePoints (S5 Tests)', () => {
    it('Resultado exacto -> puntos máximos (7 pts)', () => {
      const match = { status: 'FINISHED', homeScore: 2, awayScore: 1 } as Match;
      const prediction = { homeScore: 2, awayScore: 1, isJoker: false } as Prediction;
      // 1 (home) + 1 (away) + 2 (sign) + 3 (exact) = 7
      expect(service.calculatePoints(match, prediction)).toBe(7);
    });

    it('Solo ganador correcto -> puntos parciales (2 o 3 pts)', () => {
      const match = { status: 'FINISHED', homeScore: 3, awayScore: 1 } as Match;
      const prediction = { homeScore: 2, awayScore: 0, isJoker: false } as Prediction;
      // 0 (home) + 0 (away) + 2 (sign) = 2
      expect(service.calculatePoints(match, prediction)).toBe(2);

      const prediction2 = { homeScore: 2, awayScore: 1, isJoker: false } as Prediction;
      // 0 (home) + 1 (away) + 2 (sign) = 3
      expect(service.calculatePoints(match, prediction2)).toBe(3);
    });

    it('Predicción incorrecta -> 0 puntos', () => {
      const match = { status: 'FINISHED', homeScore: 0, awayScore: 2 } as Match;
      const prediction = { homeScore: 2, awayScore: 1, isJoker: false } as Prediction;
      expect(service.calculatePoints(match, prediction)).toBe(0);
    });
    
    it('Partido empatado predicho correctamente -> 7 pts', () => {
      const match = { status: 'FINISHED', homeScore: 1, awayScore: 1 } as Match;
      const prediction = { homeScore: 1, awayScore: 1, isJoker: false } as Prediction;
      expect(service.calculatePoints(match, prediction)).toBe(7);
    });
  });
});
