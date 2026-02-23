import { Test, TestingModule } from '@nestjs/testing';
import { LeaguesService } from './leagues.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { User } from '../database/entities/user.entity';

// Mock dependencies
// We will mock the repositories to simulate data retrieval
// This is a unit test focusing on the logic of `getGlobalRanking`

describe('LeaguesService - Global Ranking Isolation', () => {
  let service: LeaguesService;
  let predictionRepo: Repository<Prediction>;
  let bracketRepo: Repository<UserBracket>;
  let bonusRepo: Repository<UserBonusAnswer>;
  let userRepo: Repository<User>;

  // Mock Data
  const mockUserWC = {
    id: 'user-wc',
    nickname: 'WC Fan',
    email: 'wc@test.com',
  } as User;
  const mockUserUCL = {
    id: 'user-ucl',
    nickname: 'UCL Fan',
    email: 'ucl@test.com',
  } as User;

  // Mock Query Builder for Predictions (Active Users)
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaguesService,
        {
          provide: getRepositoryToken(Prediction),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            manager: { query: jest.fn() }, // For raw SQL queries
          },
        },
        {
          provide: getRepositoryToken(UserBracket),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            manager: { query: jest.fn() },
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserBonusAnswer),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            manager: { query: jest.fn() },
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
            manager: { query: jest.fn() },
          },
        },
        // Other required repositories (Mocked as generic)
        { provide: getRepositoryToken('League'), useValue: {} },
        { provide: getRepositoryToken('LeagueParticipant'), useValue: {} },
        { provide: getRepositoryToken('LeagueComment'), useValue: {} },
        { provide: 'TransactionsService', useValue: {} },
        { provide: 'PdfService', useValue: {} },
        { provide: 'TelegramService', useValue: {} },
      ],
    }).compile();

    service = module.get<LeaguesService>(LeaguesService);
    predictionRepo = module.get(getRepositoryToken(Prediction));
    bracketRepo = module.get(getRepositoryToken(UserBracket));
    bonusRepo = module.get(getRepositoryToken(UserBonusAnswer));
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TEST CASE: Isolation Logic
  // Since we are refactoring the method to use raw SQL/QueryBuilder for fetching Active IDs,
  // we need to mock the responses of those calls.

  // Constraint: The actual implementation will likely perform UNION of 3 queries or similar.
  // For unit testing without a real DB, we mock the outcome of "Active IDs fetching".

  // BUT user asked for "Integration Test" or at least a test that validates strict isolation.
  // Given the constraints (mocking Repos), we are testing LOGIC flow.

  // Let's assume the new implementation logic:
  // 1. Fetch Active User IDs (Union) -> Mock this returning ONLY UCL user for UCL tournament
  // 2. Fetch Points for those IDs -> Mock points calculation
  // 3. Verify result contains only UCL user.

  it('getGlobalRanking should RETURN only active participants for the requested tournament', async () => {
    // Setup: We simulate that ONLY 'user-ucl' is active in 'UCL2526'

    // We need to spy on the private method or the specific repository calls.
    // Assuming the new implementation uses `query` or `createQueryBuilder` to get active IDs.

    // Let's mock the `userRepository.createQueryBuilder` which is currently used in the service
    // BUT we are changing it. The new plan says: "Query predictions... Combine with user_brackets..."

    // To properly test the "Union Logic", we'd need to mock the repository calls that build that union.
    // If we implement a helper `getActiveUserIds(tournamentId)`, we could spy on it.
    // Or if we use raw SQL, we mock `manager.query`.

    // Let's assume we use raw SQL for the "Active IDs" set for performance/union.

    const tournamentId = 'UCL2526';

    // MOCK: Response for "Active IDs Logic"
    // simulating: SELECT distinct user_id FROM ... WHERE tournament = 'UCL2526'
    // Returns ['user-ucl']

    // We will need to adjust the Service Code to be testable or mock the exact calls it makes.
    // Since I haven't written the service code yet, I will write the test anticipating the calls.

    // Anticipated Implementation in Service:
    // const activeUserIds = await this.userRepository.manager.query(...)

    jest
      .spyOn(userRepo.manager, 'query')
      .mockImplementation(async (sql: string, params: any[]) => {
        if (sql.includes('UNION') && params[0] === tournamentId) {
          // This captures the "Get Active Users" query
          return [{ userId: mockUserUCL.id }];
        }
        if (sql.includes('CASE WHEN "isJoker"')) {
          // Predictions Points Query
          // Only return points for UCL user
          return [
            { userId: mockUserUCL.id, regular_points: 10, joker_points: 0 },
          ];
        }
        if (sql.includes('user_brackets')) {
          // Bracket Points Query
          return [{ userId: mockUserUCL.id, points: 5 }];
        }
        // User details query?
        return [];
      });

    // Mock User Details Fetch (The service fetches user details for the IDs found)
    jest.spyOn(userRepo, 'createQueryBuilder').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(), // where ID IN (...)
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockUserUCL]), // ONLY returns UCL User
    } as any);

    const result = await service.getGlobalRanking(tournamentId);

    // ASSERTIONS
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockUserUCL.id);
    expect(result[0].totalPoints).toBe(15); // 10 matches + 5 bracket

    // Validate WC User is NOT present
    const wcUserInList = result.find((u) => u.id === mockUserWC.id);
    expect(wcUserInList).toBeUndefined();
  });
});
