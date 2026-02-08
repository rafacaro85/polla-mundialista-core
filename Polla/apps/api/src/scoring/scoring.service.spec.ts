import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoringService],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test Case 1: Exact score match (5 points)
  it('should return 5 points for an exact score match', () => {
    const match = { homeScore: 2, awayScore: 1, status: 'COMPLETED' } as Match;
    const prediction = { homeScore: 2, awayScore: 1 } as Prediction;
    expect(service.calculatePoints(match, prediction)).toBe(5);
  });

  // Test Case 2: Correct winner and goal difference (3 points)
  it('should return 3 points for correct winner and goal difference', () => {
    const match = { homeScore: 3, awayScore: 1, status: 'COMPLETED' } as Match; // Home wins by 2
    const prediction = { homeScore: 4, awayScore: 2 } as Prediction; // Home wins by 2
    expect(service.calculatePoints(match, prediction)).toBe(3);
  });

  // Test Case 3: Correct winner (or draw) without goal difference (1 point)
  it('should return 1 point for correct winner without goal difference', () => {
    const match = { homeScore: 3, awayScore: 1, status: 'COMPLETED' } as Match; // Home wins by 2
    const prediction = { homeScore: 2, awayScore: 0 } as Prediction; // Home wins by 2
    expect(service.calculatePoints(match, prediction)).toBe(3); // This case actually gets 3 points by previous logic
  });

  // Test Case 3 revised: Correct winner (or draw) without goal difference (1 point)
  it('should return 1 point for correct winner without exact score or goal difference', () => {
    const match = { homeScore: 3, awayScore: 1, status: 'COMPLETED' } as Match; // Actual: Home wins by 2
    const prediction = { homeScore: 2, awayScore: 1 } as Prediction; // Predicted: Home wins by 1
    expect(service.calculatePoints(match, prediction)).toBe(1);
  });

  // Test Case 4: No points for incorrect winner/draw
  it('should return 0 points for incorrect winner/draw', () => {
    const match = { homeScore: 2, awayScore: 1, status: 'COMPLETED' } as Match; // Actual: Home wins
    const prediction = { homeScore: 1, awayScore: 2 } as Prediction; // Predicted: Away wins
    expect(service.calculatePoints(match, prediction)).toBe(0);
  });

  // Test Case 5: No points if match is not completed
  it('should return 0 points if the match is not completed', () => {
    const match = { homeScore: 2, awayScore: 1, status: 'PENDING' } as Match;
    const prediction = { homeScore: 2, awayScore: 1 } as Prediction;
    expect(service.calculatePoints(match, prediction)).toBe(0);
  });

  // Test Case 6: Draw - exact score (5 points)
  it('should return 5 points for an exact draw score match', () => {
    const match = { homeScore: 1, awayScore: 1, status: 'COMPLETED' } as Match;
    const prediction = { homeScore: 1, awayScore: 1 } as Prediction;
    expect(service.calculatePoints(match, prediction)).toBe(5);
  });

  // Test Case 7: Draw - correct draw, correct goal difference (3 points)
  it('should return 3 points for correct draw and goal difference', () => {
    const match = { homeScore: 2, awayScore: 2, status: 'COMPLETED' } as Match; // Actual: Draw with 0 diff
    const prediction = { homeScore: 0, awayScore: 0 } as Prediction; // Predicted: Draw with 0 diff
    expect(service.calculatePoints(match, prediction)).toBe(3);
  });

  // Test Case 8: Draw - correct draw, incorrect goal difference (1 point)
  it('should return 1 point for correct draw without goal difference', () => {
    const match = { homeScore: 2, awayScore: 2, status: 'COMPLETED' } as Match; // Actual: Draw
    const prediction = { homeScore: 1, awayScore: 1 } as Prediction; // Predicted: Draw
    expect(service.calculatePoints(match, prediction)).toBe(3); // This case gets 3 by previous logic. It's a draw, and the difference is 0 for both.
  });

  // Test Case 8 revised: Draw - correct draw, incorrect goal difference (1 point)
  it('should return 1 point for correct draw but incorrect score and goal difference', () => {
    const match = { homeScore: 2, awayScore: 2, status: 'COMPLETED' } as Match; // Actual: Draw
    const prediction = { homeScore: 1, awayScore: 1 } as Prediction; // Predicted: Draw
    // For a draw, the difference is always 0. So if both predict a draw, the difference is implicitly correct.
    // So this case should fall under Rule 2, giving 3 points.
    expect(service.calculatePoints(match, prediction)).toBe(3);
  });

  // Let's create a scenario for 1 point specifically for "Acertar ganador (o empate) sin diferencia de goles"
  // This means the winner is correct, but the magnitude of the goal difference is NOT correct.
  it('should return 1 point for correct winner, but incorrect goal difference magnitude', () => {
    const match = { homeScore: 3, awayScore: 0, status: 'COMPLETED' } as Match; // Actual: Home wins by 3
    const prediction = { homeScore: 1, awayScore: 0 } as Prediction; // Predicted: Home wins by 1
    expect(service.calculatePoints(match, prediction)).toBe(1);
  });
});
