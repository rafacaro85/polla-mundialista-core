import { Test, TestingModule } from '@nestjs/testing';
import { MatchSyncService } from './match-sync.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Match } from '../database/entities/match.entity';

describe('MatchSyncService', () => {
  let service: MatchSyncService;
  let matchesRepo: any;

  beforeEach(async () => {
    matchesRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchSyncService,
        { provide: getRepositoryToken(Match), useValue: matchesRepo },
        { provide: 'ScoringService', useValue: { calculatePointsForMatch: jest.fn() } },
        { provide: 'TournamentService', useValue: { promoteToNextRound: jest.fn() } },
        { provide: 'ConfigService', useValue: { get: jest.fn().mockReturnValue('dummy_key') } }
      ],
    }).compile();

    module.useLogger(false);
    service = module.get<MatchSyncService>(MatchSyncService);
  });

  describe('processFixtureData (S5 Tests)', () => {
    it('Estado FT -> match.status = FINISHED', async () => {
      const match = { id: 'm1', status: 'LIVE', homeScore: 0, awayScore: 0 };
      matchesRepo.findOne.mockResolvedValue(match);
      
      const fixtureData = { fixture: { id: 123, status: { short: 'FT' }, timestamp: 12345 }, goals: { home: 1, away: 0 }, teams: { home: { name: 'A' }, away: { name: 'B' } } };
      await service.processFixtureData(fixtureData);
      
      expect(match.status).toBe('FINISHED');
      expect(matchesRepo.save).toHaveBeenCalledWith(match);
    });

    it('Estado PST -> match.status = PST', async () => {
      const match = { id: 'm1', status: 'PENDING', homeScore: 0, awayScore: 0 };
      matchesRepo.findOne.mockResolvedValue(match);
      
      const fixtureData = { fixture: { id: 123, status: { short: 'PST' }, timestamp: 12345 }, goals: { home: null, away: null }, teams: { home: { name: 'A' }, away: { name: 'B' } } };
      await service.processFixtureData(fixtureData);
      
      expect(match.status).toBe('PST');
      expect(matchesRepo.save).toHaveBeenCalledWith(match);
    });

    it('Estado LIVE -> match.status = LIVE (ej. 1H)', async () => {
      const match = { id: 'm1', status: 'PENDING', homeScore: 0, awayScore: 0 };
      matchesRepo.findOne.mockResolvedValue(match);
      
      const fixtureData = { fixture: { id: 123, status: { short: '1H', elapsed: 15 }, timestamp: 12345 }, goals: { home: 1, away: 0 }, teams: { home: { name: 'A' }, away: { name: 'B' } } };
      await service.processFixtureData(fixtureData);
      
      expect(match.status).toBe('LIVE');
      expect(matchesRepo.save).toHaveBeenCalledWith(match);
    });
  });
});
