import { Test, TestingModule } from '@nestjs/testing';
import { PredictionsService } from './predictions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { Match } from '../database/entities/match.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('PredictionsService', () => {
  let service: PredictionsService;
  let matchesRepo: any;

  beforeEach(async () => {
    matchesRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionsService,
        { provide: getRepositoryToken(Prediction), useValue: {} },
        { provide: getRepositoryToken(Match), useValue: matchesRepo },
        { provide: getRepositoryToken(LeagueParticipant), useValue: {} },
        { provide: 'BracketsService', useValue: {} },
        { 
          provide: DataSource, 
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                createQueryBuilder: jest.fn().mockReturnValue({
                  leftJoinAndSelect: jest.fn().mockReturnThis(),
                  setLock: jest.fn().mockReturnThis(),
                  where: jest.fn().mockReturnThis(),
                  andWhere: jest.fn().mockReturnThis(),
                  getMany: jest.fn().mockResolvedValue([]),
                }),
                findOne: jest.fn(),
                create: jest.fn().mockReturnValue({}),
                save: jest.fn().mockResolvedValue({ id: 'pred1', homeScore: 1, awayScore: 0 }),
              }
            })
          } 
        },
      ],
    }).compile();

    service = module.get<PredictionsService>(PredictionsService);
  });

  describe('upsertPrediction (S5 Tests)', () => {
    it('Predicción en partido FINISHED -> lanza error', async () => {
      matchesRepo.findOne.mockResolvedValue({ status: 'FINISHED', date: new Date(Date.now() + 100000) });
      await expect(service.upsertPrediction('user1', 'match1', 1, 0)).rejects.toThrow(BadRequestException);
    });

    it('Predicción en partido PST -> lanza error', async () => {
      matchesRepo.findOne.mockResolvedValue({ status: 'PST', date: new Date(Date.now() + 100000) });
      await expect(service.upsertPrediction('user1', 'match1', 1, 0)).rejects.toThrow(BadRequestException);
    });

    it('Predicción válida -> se guarda correctamente', async () => {
      // PENDING status and future date
      matchesRepo.findOne.mockResolvedValue({ status: 'PENDING', date: new Date(Date.now() + 100000), isManuallyLocked: false });
      const result = await service.upsertPrediction('user1', 'match1', 1, 0);
      expect(result).toBeDefined();
      expect(result.homeScore).toBe(1);
    });
  });
});
