import * as fs from 'fs';
import { DEFAULT_TOURNAMENT_ID } from '../common/constants/tournament.constants';
import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { ScoringService } from '../scoring/scoring.service';
import { BracketsService } from '../brackets/brackets.service';
import { TournamentService } from '../tournament/tournament.service';
import { KnockoutPhasesService } from '../knockout-phases/knockout-phases.service';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MatchFinishedEvent } from './listeners/match.listener';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { League } from '../database/entities/league.entity';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(Prediction)
    private predictionsRepository: Repository<Prediction>,
    @InjectRepository(KnockoutPhaseStatus)
    private phaseStatusRepository: Repository<KnockoutPhaseStatus>,
    private scoringService: ScoringService,
    private dataSource: DataSource,
    private bracketsService: BracketsService,
    private tournamentService: TournamentService,
    private knockoutPhasesService: KnockoutPhasesService,
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(
    userId?: string,
    isAdmin: boolean = false,
    tournamentId: string = DEFAULT_TOURNAMENT_ID,
  ): Promise<Match[]> {
    const query = this.matchesRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect(
        'match.predictions',
        'prediction',
        'prediction.userId = :userId',
        { userId },
      )
      .where('match.tournamentId = :tournamentId', { tournamentId });

    if (!isAdmin) {
      const unlockedPhases = await this.phaseStatusRepository.find({
        where: { isUnlocked: true, tournamentId },
      });
      const phaseNames = unlockedPhases.map((p) => p.phase);

      // Si no hay fases desbloqueadas para este torneo, devolver array vacío para evitar errores IN ()
      if (phaseNames.length === 0) {
        return [];
      }

      query.andWhere('match.phase IN (:...phases)', { phases: phaseNames });
    }

    return query.orderBy('match.date', 'ASC').getMany();
  }

  async findLive(
    isAdmin: boolean = false,
    tournamentId: string = DEFAULT_TOURNAMENT_ID,
  ): Promise<Match[]> {
    // Obtenemos solo las fases desbloqueadas para que no aparezcan en el fixture antes de tiempo
    const unlockedPhases = await this.phaseStatusRepository.find({
      where: { isUnlocked: true, tournamentId },
    });
    const phaseNames = unlockedPhases.map((p) => p.phase);

    if (phaseNames.length === 0) {
      return [];
    }

    return this.matchesRepository.find({
      where: {
        phase: In(phaseNames),
        tournamentId,
      },
      order: { date: 'ASC' },
    });
  }

  async createMatch(data: {
    homeTeam: string;
    awayTeam: string;
    date: Date;
    externalId?: number;
    tournamentId?: string;
  }): Promise<Match> {
    const newMatch = this.matchesRepository.create({
      ...data,
      tournamentId: data.tournamentId || DEFAULT_TOURNAMENT_ID,
      homeScore: 0,
      awayScore: 0,
      status: 'NS', // Not Started
      isManuallyLocked: false,
    });
    return this.matchesRepository.save(newMatch);
  }

  async findMatchById(id: string): Promise<Match | null> {
    return this.matchesRepository.findOne({ where: { id } });
  }

  async finishMatch(
    matchId: string,
    homeScore: number,
    awayScore: number,
  ): Promise<Match> {
    const match = await this.matchesRepository.findOne({
      where: { id: matchId },
      relations: ['predictions'],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // 1. Actualizar partido
    match.status = 'FINISHED';
    match.homeScore = homeScore;
    match.awayScore = awayScore;

    // Usamos una transacción para asegurar consistencia
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(match);

      // 2. Calcular puntos para todas las predicciones
      const predictionsToUpdate: Prediction[] = [];

      if (match.predictions) {
        for (const prediction of match.predictions) {
          const points = this.scoringService.calculatePoints(match, prediction);
          prediction.points = points;
          predictionsToUpdate.push(prediction);
        }
      }

      // 3. Guardar predicciones actualizadas
      if (predictionsToUpdate.length > 0) {
        await queryRunner.manager.save(predictionsToUpdate);
      }

      await queryRunner.commitTransaction();

      // 4. Calcular puntos de bracket (fuera de la transacción)
      const winner = homeScore > awayScore ? match.homeTeam : match.awayTeam;
      await this.bracketsService.calculateBracketPoints(matchId, winner);
      this.logger.log(
        `🏆 Bracket points calculated for match ${matchId}, winner: ${winner}`,
      );

      // 5. Check and unlock next knockout phase if current phase is complete
      if (match.phase) {
        await this.knockoutPhasesService.checkAndUnlockNextPhase(
          match.phase,
          match.tournamentId,
        );
        this.logger.log(`🔓 Checked phase unlock for ${match.phase}`);
      }

      // 6. Trigger automático de promoción si es partido de grupo
      if (match.phase === 'GROUP' && match.group) {
        this.tournamentService
          .promoteFromGroup(match.group, match.tournamentId)
          .catch((err) =>
            this.logger.error(`❌ Error promoting from group ${match.group}:`, err),
          );
      }

      return match;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateMatch(id: string, data: any): Promise<Match> {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: ['predictions'],
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const wasNotFinished = match.status !== 'FINISHED';

    if (data.status !== undefined) match.status = data.status;
    if (data.homeScore !== undefined) match.homeScore = data.homeScore;
    if (data.awayScore !== undefined) match.awayScore = data.awayScore;
    if (data.phase !== undefined) match.phase = data.phase;
    if (data.group !== undefined) match.group = data.group;
    if (data.homeTeamPlaceholder !== undefined)
      match.homeTeamPlaceholder = data.homeTeamPlaceholder;
    if (data.awayTeamPlaceholder !== undefined)
      match.awayTeamPlaceholder = data.awayTeamPlaceholder;
    if (data.homeTeam !== undefined) match.homeTeam = data.homeTeam;
    if (data.awayTeam !== undefined) match.awayTeam = data.awayTeam;
    if (data.homeFlag !== undefined) match.homeFlag = data.homeFlag;
    if (data.awayFlag !== undefined) match.awayFlag = data.awayFlag;
    if (data.isManuallyLocked !== undefined)
      match.isManuallyLocked = data.isManuallyLocked;
    if (data.isTimerActive !== undefined)
      match.isTimerActive = data.isTimerActive;
    if (data.minute !== undefined) match.minute = data.minute;
    if (data.externalId !== undefined) match.externalId = data.externalId;
    if (data.date !== undefined) match.date = data.date;

    const savedMatch = await this.matchesRepository.save(match);

    // 🔥 CRITICAL: Recalculate prediction points (ASYNC via Event)
    if (
      wasNotFinished &&
      match.status === 'FINISHED' &&
      match.homeScore !== null &&
      match.awayScore !== null
    ) {
      // Emit event to handle scoring and progression asynchronously
      // We use emitAsync but we don't await it here to let the HTTP response return immediately
      this.eventEmitter.emit(
        'match.finished',
        new MatchFinishedEvent(savedMatch, match.homeScore, match.awayScore),
      );
      this.logger.log(`⚡ Event 'match.finished' emitted for match ${id}`);
    }

    return savedMatch;
  }

  async seedRound32(
    tid: string = DEFAULT_TOURNAMENT_ID,
  ): Promise<{ message: string; created: number }> {
    // Usamos QueryBuilder para borrar cascada manualmente si es necesario o por phase, filtrando por TORNEO
    await this.matchesRepository.delete({
      phase: 'ROUND_32',
      tournamentId: tid,
    });
    await this.matchesRepository.delete({
      phase: 'ROUND_16',
      tournamentId: tid,
    });
    await this.matchesRepository.delete({
      phase: 'QUARTER',
      tournamentId: tid,
    });
    await this.matchesRepository.delete({ phase: 'SEMI', tournamentId: tid });
    await this.matchesRepository.delete({
      phase: '3RD_PLACE',
      tournamentId: tid,
    });
    await this.matchesRepository.delete({ phase: 'FINAL', tournamentId: tid });

    // FECHAS OFICIALES FIFA 2026 (Hardcoded para precisión)
    const DATES = {
      R32_START: new Date('2026-06-28T16:00:00Z'),
      R16_START: new Date('2026-07-04T16:00:00Z'),
      QF_START: new Date('2026-07-09T16:00:00Z'),
      SEMI_1: new Date('2026-07-14T20:00:00Z'),
      SEMI_2: new Date('2026-07-15T20:00:00Z'),
      THIRD: new Date('2026-07-18T20:00:00Z'),
      FINAL: new Date('2026-07-19T20:00:00Z'),
    };

    // 1. ROUND_32 (16 partidos) - Del 28 Jun al 3 Jul
    // Distribución: 3, 3, 3, 3, 2, 2
    const groupMapping = [
      { h: '1A', a: '3RD-1' }, // M73 (Placeholder genérico para lógica de promoción de mejores terceros)
      { h: '1E', a: '3RD-2' }, // M74
      { h: '1F', a: '2C' }, // M75
      { h: '2A', a: '2B' }, // M76
      { h: '1I', a: '3RD-3' }, // M77
      { h: '2E', a: '2I' }, // M78
      { h: '1L', a: '3RD-4' }, // M79
      { h: '1D', a: '3RD-5' }, // M80
      { h: '1G', a: '3RD-6' }, // M81
      { h: '2K', a: '2L' }, // M82
      { h: '1H', a: '2J' }, // M83
      { h: '1B', a: '3RD-7' }, // M84
      { h: '2D', a: '2G' }, // M85
      { h: '1J', a: '2H' }, // M86
      { h: '1K', a: '3RD-8' }, // M87
      { h: '1C', a: '2F' }, // M88
    ];

    const r32 = [];
    // Cronograma Oficial Dieciseisavos 2026:
    // Junio 28: 1 Partido (Partido 73)
    // Junio 29: 3 Partidos (Partidos 74-76)
    // Junio 30: 3 Partidos (Partidos 77-79)
    // Julio 1: 3 Partidos (Partidos 80-82)
    // Julio 2: 3 Partidos (Partidos 83-85)
    // Julio 3: 3 Partidos (Partidos 86-88)

    const r32Dates = [
      '2026-06-28T16:00:00Z', // M73
      '2026-06-29T16:00:00Z',
      '2026-06-29T19:00:00Z',
      '2026-06-29T22:00:00Z', // M74-76
      '2026-06-30T16:00:00Z',
      '2026-06-30T19:00:00Z',
      '2026-06-30T22:00:00Z', // M77-79
      '2026-07-01T16:00:00Z',
      '2026-07-01T19:00:00Z',
      '2026-07-01T22:00:00Z', // M80-82
      '2026-07-02T16:00:00Z',
      '2026-07-02T19:00:00Z',
      '2026-07-02T22:00:00Z', // M83-85
      '2026-07-03T16:00:00Z',
      '2026-07-03T19:00:00Z',
      '2026-07-03T22:00:00Z', // M86-88
    ];

    for (let i = 1; i <= 16; i++) {
      r32.push(
        this.matchesRepository.create({
          phase: 'ROUND_32',
          bracketId: i,
          status: 'PENDING',
          homeTeam: '',
          awayTeam: '',
          homeTeamPlaceholder: groupMapping[i - 1].h,
          awayTeamPlaceholder: groupMapping[i - 1].a,
          date: new Date(r32Dates[i - 1]),
          tournamentId: tid,
        }),
      );
    }
    const saved32 = await this.matchesRepository.save(r32);

    // 2. ROUND_16 (8 partidos) - Del 4 Jul al 7 Jul (2 por día)
    const r16 = [];
    const r16Date = new Date(DATES.R16_START);
    for (let i = 1; i <= 8; i++) {
      r16.push(
        this.matchesRepository.create({
          phase: 'ROUND_16',
          bracketId: i,
          status: 'PENDING',
          homeTeam: '',
          awayTeam: '',
          homeTeamPlaceholder: `Ganador ${i * 2 - 1}`,
          awayTeamPlaceholder: `Ganador ${i * 2}`,
          date: new Date(r16Date),
          tournamentId: tid,
        }),
      );
      if (i % 2 === 0) r16Date.setDate(r16Date.getDate() + 1);
    }
    const saved16 = await this.matchesRepository.save(r16);

    // 3. QUARTER (4 partidos) - 9, 10, 11 Jul
    const qf = [];
    qf.push(
      this.matchesRepository.create({
        phase: 'QUARTER',
        bracketId: 1,
        status: 'PENDING',
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        homeTeamPlaceholder: 'Ganador 1',
        awayTeamPlaceholder: 'Ganador 2',
        date: new Date('2026-07-09T20:00:00Z'),
        tournamentId: tid,
      }),
    );
    qf.push(
      this.matchesRepository.create({
        phase: 'QUARTER',
        bracketId: 2,
        status: 'PENDING',
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        homeTeamPlaceholder: 'Ganador 3',
        awayTeamPlaceholder: 'Ganador 4',
        date: new Date('2026-07-10T20:00:00Z'),
        tournamentId: tid,
      }),
    );
    qf.push(
      this.matchesRepository.create({
        phase: 'QUARTER',
        bracketId: 3,
        status: 'PENDING',
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        homeTeamPlaceholder: 'Ganador 5',
        awayTeamPlaceholder: 'Ganador 6',
        date: new Date('2026-07-11T16:00:00Z'),
        tournamentId: tid,
      }),
    );
    qf.push(
      this.matchesRepository.create({
        phase: 'QUARTER',
        bracketId: 4,
        status: 'PENDING',
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        homeTeamPlaceholder: 'Ganador 7',
        awayTeamPlaceholder: 'Ganador 8',
        date: new Date('2026-07-11T20:00:00Z'),
        tournamentId: tid,
      }),
    );
    const savedQF = await this.matchesRepository.save(qf);

    // 4. SEMI (2 partidos) - 14 y 15 Jul
    const sf = [];
    sf.push(
      this.matchesRepository.create({
        phase: 'SEMI',
        bracketId: 1,
        status: 'PENDING',
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        homeTeamPlaceholder: 'Ganador 1',
        awayTeamPlaceholder: 'Ganador 2',
        date: DATES.SEMI_1,
        tournamentId: tid,
      }),
    );
    sf.push(
      this.matchesRepository.create({
        phase: 'SEMI',
        bracketId: 2,
        status: 'PENDING',
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        homeTeamPlaceholder: 'Ganador 3',
        awayTeamPlaceholder: 'Ganador 4',
        date: DATES.SEMI_2,
        tournamentId: tid,
      }),
    );
    const savedSF = await this.matchesRepository.save(sf);

    // 5. FINAL (19 Jul) - bracketId 1
    const f = await this.matchesRepository.save(
      this.matchesRepository.create({
        phase: 'FINAL',
        bracketId: 1,
        status: 'PENDING',
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        homeTeamPlaceholder: 'Ganador 1',
        awayTeamPlaceholder: 'Ganador 2',
        date: DATES.FINAL,
        tournamentId: tid,
      }),
    );

    // 6. 3RD PLACE (18 Jul) - bracketId 1
    const tp = await this.matchesRepository.save(
      this.matchesRepository.create({
        phase: '3RD_PLACE',
        bracketId: 1,
        status: 'PENDING',
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        homeTeamPlaceholder: 'Perdedor 1',
        awayTeamPlaceholder: 'Perdedor 2',
        date: DATES.THIRD,
        tournamentId: tid,
      }),
    );

    // CONEXIONES
    for (let i = 0; i < 16; i++) {
      saved32[i].nextMatchId = saved16[Math.floor(i / 2)].id;
      await this.matchesRepository.save(saved32[i]);
    }
    for (let i = 0; i < 8; i++) {
      saved16[i].nextMatchId = savedQF[Math.floor(i / 2)].id;
      await this.matchesRepository.save(saved16[i]);
    }
    for (let i = 0; i < 4; i++) {
      savedQF[i].nextMatchId = savedSF[Math.floor(i / 2)].id;
      await this.matchesRepository.save(savedQF[i]);
    }
    for (let i = 0; i < 2; i++) {
      savedSF[i].nextMatchId = f.id;
      await this.matchesRepository.save(savedSF[i]);
    }

    return {
      message: 'Tournament Keys 2026 Seeded (Correct Dates + 3rd Place)',
      created: 32,
    };
  }

  async seedUCLKnockout(): Promise<{ message: string; created: number }> {
    const tid = 'UCL2526';
    // 1. Limpiar datos existentes de UCL (Eliminar Matches y PhaseStatus para recrearlos limpios)
    await this.matchesRepository.delete({ tournamentId: tid });
    await this.phaseStatusRepository.delete({ tournamentId: tid });

    // 2. Definir Equipos y Logos (Club Crests - High Quality SVGs)
    const TEAMS: Record<string, string> = {
      'Manchester City':
        'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
      'Real Madrid':
        'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      'Bayern Munich':
        'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
      Liverpool:
        'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
      'Inter Milan':
        'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
      Inter:
        'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
      Arsenal: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
      Barcelona:
        'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
      PSG: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
      'Atletico Madrid':
        'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
      'Atlético Madrid':
        'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
      'Borussia Dortmund':
        'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
      Dortmund:
        'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
      'Bayer Leverkusen':
        'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
      Leverkusen:
        'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
      Juventus:
        'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg',
      'AC Milan':
        'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
      Benfica:
        'https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg',
      'Aston Villa':
        'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg',
      PSV: 'https://upload.wikimedia.org/wikipedia/en/0/05/PSV_Eindhoven.svg',
      Galatasaray:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Galatasaray_Sports_Club_Logo.png/240px-Galatasaray_Sports_Club_Logo.png',
      Atalanta: 'https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg',
      Monaco: 'https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC.svg',
      Qarabag:
        'https://upload.wikimedia.org/wikipedia/en/9/9b/Qaraba%C4%9F_FK_logo.svg',
      Newcastle:
        'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
      Olympiacos:
        'https://upload.wikimedia.org/wikipedia/en/f/f1/Olympiacos_CF_logo.svg',
      'Bodo/Glimt':
        'https://upload.wikimedia.org/wikipedia/en/f/f5/FK_Bod%C3%B8_Glimt.svg',
      'Club Brujas':
        'https://upload.wikimedia.org/wikipedia/en/d/d0/Club_Brugge_KV_logo.svg',
      // NEW TEAMS
      Tottenham:
        'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
      Chelsea: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
      'Sporting Lisboa':
        'https://upload.wikimedia.org/wikipedia/en/e/e1/Sporting_Clube_de_Portugal_%28Logo%29.svg',
      'Sporting CP':
        'https://upload.wikimedia.org/wikipedia/en/e/e1/Sporting_Clube_de_Portugal_%28Logo%29.svg',
    };

    const getLogo = (team: string) => {
      // Intentar coincidencia exacta o default
      return (
        TEAMS[team] ||
        TEAMS[Object.keys(TEAMS).find((k) => k.includes(team)) || ''] ||
        ''
      );
    };

    // 3. Recrear PhaseStatuses
    const PHASES = [
      { p: 'PLAYOFF_1', unlocked: true },  // Primera vuelta (partidos de ida) - ya se jugaron
      { p: 'PLAYOFF_2', unlocked: true },  // Segunda vuelta (partidos de vuelta) - 24-25 Feb
      { p: 'ROUND_16', unlocked: false },
      { p: 'QUARTER', unlocked: false },
      { p: 'SEMI', unlocked: false },
      { p: 'FINAL', unlocked: false },
    ];

    for (const ph of PHASES) {
      // Buscar si ya existe para evitar duplicados que causen errores de constraint
      let status = await this.phaseStatusRepository.findOne({
        where: { phase: ph.p, tournamentId: tid },
      });

      if (!status) {
        status = this.phaseStatusRepository.create({
          phase: ph.p,
          tournamentId: tid,
          isUnlocked: ph.unlocked,
          unlockedAt: ph.unlocked ? new Date() : new Date(0), // Dummy date if not nullable, or handle null
          allMatchesCompleted: false,
        });
      } else {
        // Update existing
        status.isUnlocked = ph.unlocked;
        status.unlockedAt = ph.unlocked ? new Date() : new Date(0);
        status.allMatchesCompleted = false;
      }

      await this.phaseStatusRepository.save(status);
    }

    // 4. Partidos Play-off
    const PLAYOFF_IDA = [
      { h: 'Galatasaray', a: 'Juventus', d: '2026-02-17T17:45:00Z' },
      { h: 'Dortmund', a: 'Atalanta', d: '2026-02-17T20:00:00Z' },
      { h: 'Monaco', a: 'PSG', d: '2026-02-17T20:00:00Z' },
      { h: 'Benfica', a: 'Real Madrid', d: '2026-02-17T20:00:00Z' },
      { h: 'Qarabag', a: 'Newcastle', d: '2026-02-18T17:45:00Z' },
      { h: 'Olympiacos', a: 'Leverkusen', d: '2026-02-18T20:00:00Z' },
      { h: 'Bodo/Glimt', a: 'Inter', d: '2026-02-18T20:00:00Z' },
      { h: 'Club Brujas', a: 'Atlético Madrid', d: '2026-02-18T20:00:00Z' },
    ];
    const PLAYOFF_VUELTA = [
      { h: 'Atlético Madrid', a: 'Club Brujas', d: '2026-02-24T17:45:00Z' },
      { h: 'Newcastle', a: 'Qarabag', d: '2026-02-24T20:00:00Z' },
      { h: 'Leverkusen', a: 'Olympiacos', d: '2026-02-24T20:00:00Z' },
      { h: 'Atalanta', a: 'Dortmund', d: '2026-02-25T17:45:00Z' },
      { h: 'PSG', a: 'Monaco', d: '2026-02-25T20:00:00Z' },
      { h: 'Real Madrid', a: 'Benfica', d: '2026-02-25T20:00:00Z' },
      { h: 'Juventus', a: 'Galatasaray', d: '2026-02-25T20:00:00Z' },
      { h: 'Inter', a: 'Bodo/Glimt', d: '2026-02-24T20:00:00Z' },
    ];

    // 5. Partidos Octavos (ROUND_16) - Updated with correct Top 8 teams
    const OCTAVOS = [
      {
        date: '2026-03-10T20:00:00Z',
        home: '',
        away: 'Arsenal',
        homePlaceholder: 'Ganador Play-off',
        bracketId: 1,
        stadium: 'Emirates Stadium',
      },
      {
        date: '2026-03-10T20:00:00Z',
        home: '',
        away: 'Bayern Munich',
        homePlaceholder: 'Ganador Play-off',
        bracketId: 2,
        stadium: 'Allianz Arena',
      },
      {
        date: '2026-03-11T20:00:00Z',
        home: '',
        away: 'Liverpool',
        homePlaceholder: 'Ganador Play-off',
        bracketId: 3,
        stadium: 'Anfield',
      },
      {
        date: '2026-03-11T20:00:00Z',
        home: '',
        away: 'Tottenham',
        homePlaceholder: 'Ganador Play-off',
        bracketId: 4,
        stadium: 'Tottenham Hotspur Stadium',
      },
      {
        date: '2026-03-17T20:00:00Z',
        home: '',
        away: 'Barcelona',
        homePlaceholder: 'Ganador Play-off',
        bracketId: 5,
        stadium: 'Camp Nou',
      },
      {
        date: '2026-03-17T20:00:00Z',
        home: '',
        away: 'Chelsea',
        homePlaceholder: 'Ganador Play-off',
        bracketId: 6,
        stadium: 'Stamford Bridge',
      },
      {
        date: '2026-03-18T20:00:00Z',
        home: '',
        away: 'Sporting Lisboa',
        homePlaceholder: 'Ganador Play-off',
        bracketId: 7,
        stadium: 'Estádio José Alvalade',
      },
      {
        date: '2026-03-18T20:00:00Z',
        home: '',
        away: 'Manchester City',
        homePlaceholder: 'Ganador Play-off',
        bracketId: 8,
        stadium: 'Etihad Stadium',
      },

      // Vueltas (Swapped Home/Away)
      {
        date: '2026-03-24T20:00:00Z',
        home: 'Arsenal',
        away: '',
        awayPlaceholder: 'Ganador Play-off',
        bracketId: 1,
        stadium: 'Emirates Stadium',
      },
      {
        date: '2026-03-24T20:00:00Z',
        home: 'Bayern Munich',
        away: '',
        awayPlaceholder: 'Ganador Play-off',
        bracketId: 2,
        stadium: 'Allianz Arena',
      },
      {
        date: '2026-03-25T20:00:00Z',
        home: 'Liverpool',
        away: '',
        awayPlaceholder: 'Ganador Play-off',
        bracketId: 3,
        stadium: 'Anfield',
      },
      {
        date: '2026-03-25T20:00:00Z',
        home: 'Tottenham',
        away: '',
        awayPlaceholder: 'Ganador Play-off',
        bracketId: 4,
        stadium: 'Tottenham Hotspur Stadium',
      },
      {
        date: '2026-03-31T20:00:00Z',
        home: 'Barcelona',
        away: '',
        awayPlaceholder: 'Ganador Play-off',
        bracketId: 5,
        stadium: 'Camp Nou',
      },
      {
        date: '2026-04-01T20:00:00Z',
        home: 'Chelsea',
        away: '',
        awayPlaceholder: 'Ganador Play-off',
        bracketId: 6,
        stadium: 'Stamford Bridge',
      },
      {
        date: '2026-04-01T20:00:00Z',
        home: 'Sporting Lisboa',
        away: '',
        awayPlaceholder: 'Ganador Play-off',
        bracketId: 7,
        stadium: 'Estádio José Alvalade',
      },
      {
        date: '2026-04-01T20:00:00Z',
        home: 'Manchester City',
        away: '',
        awayPlaceholder: 'Ganador Play-off',
        bracketId: 8,
        stadium: 'Etihad Stadium',
      },
    ];

    const entities: Match[] = [];

    // Playoff Ida
    PLAYOFF_IDA.forEach((m) => {
      entities.push(
        this.matchesRepository.create({
          homeTeam: m.h,
          awayTeam: m.a,
          homeFlag: getLogo(m.h),
          awayFlag: getLogo(m.a),
          date: new Date(m.d),
          phase: 'PLAYOFF_1',
          status: 'PENDING',
          tournamentId: tid,
        }),
      );
    });

    // Playoff Vuelta
    PLAYOFF_VUELTA.forEach((m) => {
      entities.push(
        this.matchesRepository.create({
          homeTeam: m.h,
          awayTeam: m.a,
          homeFlag: getLogo(m.h),
          awayFlag: getLogo(m.a),
          date: new Date(m.d),
          phase: 'PLAYOFF_2',
          status: 'PENDING',
          tournamentId: tid,
        }),
      );
    });

    OCTAVOS.forEach((m) => {
      entities.push(
        this.matchesRepository.create({
          homeTeam: m.home,
          awayTeam: m.away,
          homeFlag: getLogo(m.home),
          awayFlag: getLogo(m.away),
          homeTeamPlaceholder: (m as any).homePlaceholder,
          awayTeamPlaceholder: (m as any).awayPlaceholder,
          date: new Date(m.date),
          bracketId: m.bracketId,
          phase: 'ROUND_16',
          status: 'PENDING',
          tournamentId: tid,
          stadium: m.stadium,
        }),
      );
    });

    await this.matchesRepository.save(entities);

    return {
      message: 'UCL 25/26 Full Reset & Seeding Complete',
      created: entities.length,
    };
  }

  async promoteAllGroups(tid: string = DEFAULT_TOURNAMENT_ID): Promise<void> {
    return this.tournamentService.promoteAllCompletedGroups(tid);
  }

  async simulateResults(
    phase?: string,
    tid: string = DEFAULT_TOURNAMENT_ID,
  ): Promise<{ message: string; updated: number }> {
    try {
      // Determinamos qué fase simular
      let targetPhase = phase;

      if (!targetPhase) {
        // Si no se especifica, buscamos la primera fase desbloqueada PARA ESTE TORNEO que tenga partidos pendientes
        const unlockedPhases = await this.phaseStatusRepository.find({
          where: {
            isUnlocked: true,
            allMatchesCompleted: false,
            tournamentId: tid, // 🔥 Critical fix: filter by tournament using tid
          },
        });

        // Orden real de las fases (Merged order is OK, filtering handles isolation)
        const phaseOrder =
          tid === 'UCL2526'
            ? ['PLAYOFF_1', 'PLAYOFF_2', 'ROUND_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL']
            : [
                'GROUP',
                'ROUND_32',
                'ROUND_16',
                'QUARTER',
                'SEMI',
                '3RD_PLACE',
                'FINAL',
              ];

        const sortedUnlocked = unlockedPhases.sort(
          (a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase),
        );

        if (sortedUnlocked.length > 0) {
          targetPhase = sortedUnlocked[0].phase;
        } else {
          targetPhase = tid === 'UCL2526' ? 'PLAYOFF_1' : 'GROUP'; // Default
        }
      }

      this.logger.log(
        `🤖 [SIMULATOR] Iniciando simulación para fase: ${targetPhase} (${tid})`,
      );

      // NEW: Ensure integrity of tournament structure before anything
      const integrityCheck = await this.ensureTournamentIntegrity(tid);
      if (integrityCheck.repaired) {
        // If structure was repaired, we must re-sync any pending promotions
        this.logger.log(
          `🔄 [SIMULATOR] Integrity repair detected for ${tid}. Re-running promotions to fill new slots...`,
        );
        await this.tournamentService.promotePhaseWinners('ROUND_16', tid);
        if (tid === 'UCL2526') {
            await this.tournamentService.promotePhaseWinners('QUARTER_FINAL', tid);
            await this.tournamentService.promotePhaseWinners('SEMI_FINAL', tid);
        } else {
            await this.tournamentService.promotePhaseWinners('QUARTER', tid);
            await this.tournamentService.promotePhaseWinners('SEMI', tid);
        }
      }

      // SELF-HEALING: Antes de simular, aseguramos que la fase anterior haya propagado sus ganadores.
      // Esto corrige situaciones donde la fase N está vacía a pesar de que N-1 terminó.
      if (
        targetPhase !== 'GROUP' &&
        targetPhase !== 'PLAYOFF' &&
        targetPhase !== 'PLAYOFF_1'
      ) {
        const phaseOrder =
          tid === 'UCL2526'
            ? ['PLAYOFF_1', 'PLAYOFF_2', 'ROUND_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL']
            : [
                'GROUP',
                'ROUND_32',
                'ROUND_16',
                'QUARTER',
                'SEMI',
                '3RD_PLACE',
                'FINAL',
              ];

        const prevIndex = phaseOrder.indexOf(targetPhase) - 1;
        if (prevIndex >= 0) {
          const prevPhase = phaseOrder[prevIndex];
          this.logger.log(
            `🚑 [SELF-HEALING] Verificando propagación desde ${prevPhase}...`,
          );
          if (prevPhase === 'GROUP') {
            await this.tournamentService.promoteAllCompletedGroups(tid);
          } else {
            await this.tournamentService.promotePhaseWinners(prevPhase, tid);
          }
        }
      }

      // Obtenemos partidos de esa fase que no estén finalizados y sean del torneo correcto
      const matches = await this.matchesRepository.find({
        where: {
          phase: targetPhase,
          tournamentId: tid, // 🔥 Filter by tournament using tid
          status: In([
            'PENDING',
            'NS',
            'LIVE',
            'IN_PROGRESS',
            'NOT_STARTED',
            'SCHEDULED',
          ]),
        },
      });

      this.logger.log(
        `🤖 [SIMULATOR] Encontrados ${matches.length} partidos pendientes en fase ${targetPhase}`,
      );

      let updatedCount = 0;

      for (const match of matches) {
        // Solo simular si tiene equipos definidos (no placeholders vacíos)
        // Nota: En knockout, los placeholders como '1A' cuentan como homeTeam en la DB si el seeder fue así
        // pero para simular necesitamos que tengan equipos reales o que el usuario quiera simular placeholders
        if (match.homeTeam && match.awayTeam) {
          const generateScore = () => {
            const r = Math.random();
            if (r < 0.2) return 0;
            if (r < 0.5) return 1;
            if (r < 0.8) return 2;
            if (r < 0.95) return 3;
            return 4;
          };

          let homeScore = generateScore();
          let awayScore = generateScore();

          // En fases eliminatorias, NO permitimos empates en la simulación para que el torneo avance
          if (targetPhase !== 'GROUP' && homeScore === awayScore) {
            // Desempatar al azar
            if (Math.random() > 0.5) homeScore++;
            else awayScore++;
          }

          const updatedMatch = await this.matchesRepository.save({
            ...match,
            homeScore,
            awayScore,
            status: 'FINISHED',
            isManuallyLocked: true,
          });

          // Trigger Points Calculation (Ensure scores are updated)
          if (this['scoringService']) {
            await this['scoringService'].calculatePointsForMatch(
              updatedMatch.id,
            );
          }

          // Determine Winner for Bracket Points
          const winner =
            homeScore > awayScore ? match.homeTeam : match.awayTeam;

          // Trigger Bracket Points Calculation
          if (this.bracketsService) {
            await this.bracketsService.calculateBracketPoints(
              updatedMatch.id,
              winner,
            );
          }

          // Trigger Promotion (Critical Step Added)
          if (targetPhase !== 'GROUP') {
            await this.tournamentService.promoteToNextRound(updatedMatch);
          }

          updatedCount++;

          if (updatedCount % 10 === 0) {
            this.logger.log(
              `🤖 [SIMULATOR] Progreso: ${updatedCount}/${matches.length} partidos procesados...`,
            );
          }
        }
      }

      // CRITICAL: After simulation loop, check if phase is complete and UNLOCK NEXT PHASE
      const resolvedTid =
        matches.length > 0 ? matches[0].tournamentId : DEFAULT_TOURNAMENT_ID; // Default to WC2026 if no matches found
      const isPhaseComplete =
        await this.knockoutPhasesService.areAllMatchesCompleted(
          targetPhase,
          resolvedTid,
        );
      if (isPhaseComplete) {
        this.logger.log(
          `✅ Phase ${targetPhase} simulation complete. Promoting and Unlocking next phase...`,
        );

        // 1. If it was GROUP phase, promote all groups to R32
        if (targetPhase === 'GROUP') {
          await this.tournamentService.promoteAllCompletedGroups(resolvedTid);
        } else {
          // For Knockout phases, ensure batch promotion runs to catch any missed updates
          await this.tournamentService.promotePhaseWinners(
            targetPhase,
            resolvedTid,
          );
        }

        // 2. Unlock the next phase status so it becomes visible
        await this.knockoutPhasesService.checkAndUnlockNextPhase(
          targetPhase,
          resolvedTid,
        );
      }

      return {
        message: `Simulación de ${targetPhase} completada: ${updatedCount} partidos finalizados.`,
        updated: updatedCount,
      };
    } catch (error) {
      this.logger.error(
        `❌ [SIMULATOR ERROR] Error simulando resultados para fase ${phase}:`,
        error,
      );
      try {
        fs.writeFileSync(
          'sim_error.log',
          JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
        );
      } catch (e) {
        this.logger.error('Log write failed', e);
      }
      throw error;
    }
  }

  async resetAllMatches(
    tid?: string,
  ): Promise<{ message: string; reset: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(
        `🧹 [RESET] Iniciando reseteo de partidos. TournamentId: ${tid || 'ALL'}`,
      );

      // 1. Limpiar partidos (score=null, status='PENDING')
      const qbMatches = queryRunner.manager
        .createQueryBuilder()
        .update(Match)
        .set({
          homeScore: null,
          awayScore: null,
          status: 'PENDING',
          isManuallyLocked: false,
        });

      if (tid) {
        qbMatches.where('"tournamentId" = :tid', { tid });
      }
      await qbMatches.execute();

      // CRÍTICO: Limpiar equipos de fases eliminatorias que tienen placeholders.
      // Para UCL2526: NO limpiar ROUND_16 porque esos cruces son fijos (configurados por el admin).
      // Para WC2026: limpiar TODO excepto GROUP (los equipos de knockout vienen de la promoción de grupos).
      const keepPhasesForReset =
        tid === 'UCL2526'
          ? `phase NOT IN ('GROUP', 'PLAYOFF', 'PLAYOFF_1', 'PLAYOFF_2', 'ROUND_16')`
          : `phase NOT IN ('GROUP')`;

      const qbPlaceholders = queryRunner.manager
        .createQueryBuilder()
        .update(Match)
        .set({
          homeTeam: '',
          awayTeam: '',
          homeFlag: null,
          awayFlag: null,
        })
        .where(
          `${keepPhasesForReset} AND ("homeTeamPlaceholder" IS NOT NULL OR "awayTeamPlaceholder" IS NOT NULL)`,
        );

      if (tid) {
        qbPlaceholders.andWhere('"tournamentId" = :tid', { tid });
      }
      await qbPlaceholders.execute();


      // 2. Resetear todas las predicciones a 0 puntos
      const qbPreds = queryRunner.manager
        .createQueryBuilder()
        .update(Prediction)
        .set({ points: 0 });

      if (tid) {
        qbPreds.where('"tournamentId" = :tid', { tid });
      }
      await qbPreds.execute();

      // 3. Resetear puntos de Brackets
      const qbBrackets = queryRunner.manager
        .createQueryBuilder()
        .update(UserBracket)
        .set({ points: 0 });

      if (tid) {
        qbBrackets.where('"tournamentId" = :tid', { tid });
      }
      await qbBrackets.execute();

      // NEW 3.5: Limpiar respuestas de Bonus (esto suele ensuciar simulaciones)
      this.logger.log('🧹 [RESET] Eliminando respuestas de bonus...');
      const bonusSubQuery = queryRunner.manager
        .createQueryBuilder()
        .subQuery()
        .select('q.id')
        .from(BonusQuestion, 'q');
      
      if (tid) {
        bonusSubQuery.where('q."tournamentId" = :tid', { tid });
      }

      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(UserBonusAnswer)
        .where(`"questionId" IN ${bonusSubQuery.getQuery()}`)
        .setParameters(bonusSubQuery.getParameters())
        .execute();

      // 4. Resetear estados de fases eliminatorias
      const qbPhases = queryRunner.manager
        .createQueryBuilder()
        .update(KnockoutPhaseStatus)
        .set({
          isUnlocked: false,
          allMatchesCompleted: false,
          unlockedAt: null,
        });

      if (tid) {
        qbPhases.where('"tournamentId" = :tid', { tid });
      }
      await qbPhases.execute();

      // Re-abrir fases iniciales
      const initialPhases = [];
      if (!tid || tid === DEFAULT_TOURNAMENT_ID)
        initialPhases.push({ tid: DEFAULT_TOURNAMENT_ID, phase: 'GROUP' });
      if (!tid || tid === 'UCL2526')
        initialPhases.push({ tid: 'UCL2526', phase: 'ROUND_16' });

      for (const item of initialPhases) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(KnockoutPhaseStatus)
          .set({ isUnlocked: true })
          .where('phase = :p AND "tournamentId" = :t', {
            p: item.phase,
            t: item.tid,
          })
          .execute();
      }

      // 5. RECALCULAR Puntos de Participantes
      // Ponemos TODO en 0 para las columnas de caché de participantes del torneo afectado.
      // Así evitamos que queden rastros de la simulación.
      this.logger.log('🔄 [RESET] Reseteando columnas de puntos en participantes...');

      // Estrategia Nuclear: Si es para un torneo, reseteamos participants de ese torneo.
      // Nota: participants están ligados a leagues, y leagues a tournaments.
      
      await queryRunner.query(`
          UPDATE league_participants lp
          SET 
            prediction_points = 0,
            bracket_points = 0,
            joker_points = 0,
            total_points = COALESCE(lp.trivia_points, 0)
          FROM leagues l
          WHERE lp.league_id = l.id
          ${tid ? `AND l."tournamentId" = '${tid}'` : ''}
      `);

      // Opcional: Recalcular basándonos en lo que quedó (si reseteamos un torneo pero el usuario está en otros)
      // Pero como ya seteamos predictions.points=0 arriba, este recalculo dejará los puntos del torneo en 0 
      // y mantendrá los de otros torneos si los hubiera.
      
      this.logger.log('🔄 [RESET] Recalculando puntos remanentes (otros torneos)...');

      // Recalcular predictionPoints + jokerPoints combinados
      await queryRunner.query(`
                UPDATE league_participants lp 
                SET prediction_points = COALESCE((
                    SELECT SUM(CASE WHEN p."isJoker" IS TRUE THEN p.points / 2 ELSE p.points END)
                    FROM predictions p 
                    WHERE CAST(p.league_id AS VARCHAR) = CAST(lp.league_id AS VARCHAR) 
                    AND p."userId" = lp.user_id
                ), 0),
                joker_points = COALESCE((
                    SELECT SUM(CASE WHEN p."isJoker" IS TRUE THEN p.points / 2 ELSE 0 END)
                    FROM predictions p 
                    WHERE CAST(p.league_id AS VARCHAR) = CAST(lp.league_id AS VARCHAR) 
                    AND p."userId" = lp.user_id
                ), 0)
            `);

      // Recalcular bracketPoints
      await queryRunner.query(`
                UPDATE league_participants lp 
                SET bracket_points = COALESCE((
                    SELECT SUM(ub.points)
                    FROM user_brackets ub 
                    WHERE CAST(ub."leagueId" AS VARCHAR) = CAST(lp.league_id AS VARCHAR) 
                    AND ub."userId" = lp.user_id
                ), 0)
            `);

      // Update Total Final
      await queryRunner.query(`
                UPDATE league_participants 
                SET total_points = COALESCE(prediction_points, 0) + COALESCE(bracket_points, 0) + COALESCE(trivia_points, 0) + COALESCE(joker_points, 0)
            `);

      await queryRunner.commitTransaction();

      // 6. INVALIDACIÓN DE CACHÉ NUCLEAR
      this.logger.log('🧹 [RESET] Invalidando caché de rankings...');
      try {
        const currentTid = tid || DEFAULT_TOURNAMENT_ID;
        await this.cacheManager.del(`ranking:global:${currentTid}`);
        if (!tid) await this.cacheManager.del(`ranking:global:UCL2526`);

        // Obtener todas las ligas afectadas para borrar sus cachés individuales
        const affectedLeagues = await this.dataSource.getRepository(League).find({
           where: tid ? { tournamentId: tid } : {},
           select: ['id']
        });

        for (const league of affectedLeagues) {
           await this.cacheManager.del(`ranking:league:${league.id}`);
        }
        this.logger.log(`✅ [RESET] Caché invalidada para ${affectedLeagues.length} ligas.`);
      } catch (cacheErr) {
        this.logger.error('⚠️ [RESET] Error invalidando caché (no crítico):', cacheErr);
      }

      return {
        message: `Sistema reiniciado correctamente para ${tid || 'TODOS'}. Puntos recalculados y caché limpia.`,
        reset: 1,
      };
    } catch (error) {
      this.logger.error('❌ Error profundo en resetAllMatches:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async diagnoseAndFixSchedule() {
    // Find ALL Group Matches on or after June 28 (Start of R32)
    const badGroupMatches = await this.matchesRepository
      .createQueryBuilder('m')
      .where("m.phase = 'GROUP'")
      .andWhere("m.date >= '2026-06-28'")
      .getMany();

    this.logger.log(`Found ${badGroupMatches.length} misplaced group matches.`);

    // Fix: Move them to June 11 (Opening day default)
    // This clears the schedule for the Knockout Phase.
    for (const m of badGroupMatches) {
      m.date = new Date('2026-06-11T16:00:00Z');
      await this.matchesRepository.save(m);
    }

    return {
      fixed: badGroupMatches.length,
      matches: badGroupMatches.map(
        (m) => `${m.id}: ${m.homeTeam}-${m.awayTeam} (${m.date})`,
      ),
    };
  }

  /**
   * 🔧 REPAIR: Re-procesa TODOS los partidos knockout terminados.
   * - Re-promueve ganadores a la siguiente fase
   * - Re-calcula bracket points
   * Seguro de ejecutar múltiples veces (idempotente).
   */
  async repairKnockoutBracket(tid: string): Promise<any> {
    this.logger.log(`🔧 [REPAIR] Starting knockout bracket repair for ${tid}...`);
    const results: string[] = [];

    // 1. Re-promote all finished knockout matches
    const knockoutPhases = ['ROUND_16', 'QUARTER_FINAL', 'QUARTER', 'SEMI_FINAL', 'SEMI'];
    
    for (const phase of knockoutPhases) {
      const finishedMatches = await this.matchesRepository.find({
        where: { phase, tournamentId: tid, status: In(['FINISHED', 'COMPLETED']) },
      });
      
      if (finishedMatches.length === 0) continue;
      
      this.logger.log(`🔧 [REPAIR] Processing ${finishedMatches.length} finished matches in ${phase}...`);
      
      for (const match of finishedMatches) {
        try {
          await this.tournamentService.promoteToNextRound(match);
          results.push(`✅ Promoted winner from ${phase} bracket ${match.bracketId} (${match.homeTeam} vs ${match.awayTeam})`);
        } catch (e: any) {
          results.push(`❌ Error promoting ${phase} bracket ${match.bracketId}: ${e.message}`);
        }
      }
    }

    // 2. Re-calculate bracket points for all finished knockout matches
    // For LEG matches: use LEG_1 id (where users saved their picks)
    const allFinished = await this.matchesRepository.find({
      where: { tournamentId: tid, status: In(['FINISHED', 'COMPLETED']) },
    });

    const knockoutFinished = allFinished.filter(m => 
      m.phase && !['GROUP', 'PLAYOFF_1', 'PLAYOFF_2'].includes(m.phase)
    );

    // Group by bracketId+phase to handle LEG matches
    const bracketGroups: Record<string, typeof knockoutFinished> = {};
    for (const m of knockoutFinished) {
      const key = `${m.phase}_${m.bracketId}`;
      if (!bracketGroups[key]) bracketGroups[key] = [];
      bracketGroups[key].push(m);
    }

    for (const [key, matches] of Object.entries(bracketGroups)) {
      const leg1 = matches.find(m => m.group === 'LEG_1');
      const leg2 = matches.find(m => m.group === 'LEG_2');
      
      if (leg1 && leg2) {
        // UCL ida/vuelta — calculate aggregate winner
        if (leg1.homeScore === null || leg2.homeScore === null) continue;
        const teamAGoals = (leg1.homeScore ?? 0) + (leg2.awayScore ?? 0);
        const teamBGoals = (leg1.awayScore ?? 0) + (leg2.homeScore ?? 0);
        
        let winner: string;
        if (teamAGoals > teamBGoals) {
          winner = leg1.homeTeam;
        } else if (teamBGoals > teamAGoals) {
          winner = leg1.awayTeam;
        } else {
          results.push(`⚠️ ${key}: Aggregate tie, cannot auto-determine winner`);
          continue;
        }
        
        try {
          await this.bracketsService.calculateBracketPoints(leg1.id, winner);
          results.push(`🏆 Bracket points recalculated for ${key} (winner: ${winner}) using LEG_1 id`);
        } catch (e: any) {
          results.push(`❌ Error calculating bracket points for ${key}: ${e.message}`);
        }
      } else if (matches.length === 1 && !matches[0].group?.startsWith('LEG_')) {
        // Single match (WC or UCL final)
        const m = matches[0];
        if (m.homeScore === null || m.awayScore === null) continue;
        const winner = (m.homeScore ?? 0) > (m.awayScore ?? 0) ? m.homeTeam : m.awayTeam;
        
        try {
          await this.bracketsService.calculateBracketPoints(m.id, winner);
          results.push(`🏆 Bracket points recalculated for ${key} (winner: ${winner})`);
        } catch (e: any) {
          results.push(`❌ Error calculating bracket points for ${key}: ${e.message}`);
        }
      }
    }

    this.logger.log(`🔧 [REPAIR] Complete. ${results.length} operations.`);
    return { tournament: tid, operations: results.length, details: results };
  }

  /**
   * Checks if all knockout phases exist and have correct match counts.
   * If not, it recreates the missing phases and heals the links.
   * This is an IDEMPOTENT operation safe to run multiple times.
   */
  async ensureTournamentIntegrity(tid: string = DEFAULT_TOURNAMENT_ID) {
    this.logger.log(`🛡️ [INTEGRITY] Checking Tournament Structure for ${tid}...`);

    // En el Mundial 2026 esperamos: 16 R32, 8 R16, 4 QF, 2 SEMI, 1 FINAL, 1 3RD_PLACE
    const counts = await this.matchesRepository
      .createQueryBuilder('m')
      .select('m.phase', 'phase')
      .addSelect('COUNT(*)', 'count')
      .where('m.tournamentId = :tid', { tid })
      .groupBy('m.phase')
      .getRawMany();

    const phaseCounts: Record<string, number> = {};
    counts.forEach((c) => (phaseCounts[c.phase] = parseInt(c.count)));

    const isCorrupted =
      (tid === DEFAULT_TOURNAMENT_ID &&
        ((phaseCounts['ROUND_32'] || 0) < 16 ||
          (phaseCounts['ROUND_16'] || 0) < 8 ||
          (phaseCounts['QUARTER'] || 0) < 4 ||
          (phaseCounts['SEMI'] || 0) < 2)) ||
      (tid === 'UCL2526' && (phaseCounts['ROUND_16'] || 0) < 16); // UCL 25/26 beta has 16 matches for R16 (8 ida + 8 vuelta)

    if (isCorrupted) {
      this.logger.log(
        `🚨 [INTEGRITY] DETECTED MISSING PHASES IN ${tid}. Auto-Repair DISABLED to prevent data loss.`,
      );
      return {
        repaired: false,
        message: 'Structure corrupted but auto-repair disabled.',
      };

      /*
      // 0. SAFETY: Unlink Foreign Keys before deletion
      this.logger.log('🧹 [INTEGRITY] Unlinking FK references...');
      const phasesToDelete = [
        'ROUND_32',
        'ROUND_16',
        'QUARTER',
        'SEMI',
        '3RD_PLACE',
        'FINAL',
        'PLAYOFF',
      ];

      await this.matchesRepository
        .createQueryBuilder()
        .update(Match)
        .set({ nextMatchId: null as any })
        .where('phase IN (:...phases) AND "tournamentId" = :tid', {
          phases: phasesToDelete,
          tid,
        })
        .execute();

      // 1. Clean potentially corrupted knockout phases for THIS tournament
      await this.matchesRepository.delete({
        phase: In(phasesToDelete),
        tournamentId: tid,
      });

      // 2. Re-create using the official seeder logic
      this.logger.log(`🔨 [INTEGRITY] Re-seeding knockout structure for ${tid}...`);

      if (tid === 'WC2026') {
        // For World Cup, we use the standard 32-team knockout (starts at R32)
        await this.seedRound32(tid);
      } else if (tid === 'UCL2526') {
        // Re-seed using integrated UCL logic
        await this.seedUCLKnockout();
      }

      this.logger.log('✅ [INTEGRITY] Tournament structure repaired.');
      return { repaired: true, message: 'Structure restored from seeds.' };
      */
    }

    this.logger.log('✅ [INTEGRITY] Structure appears healthy.');
    return { repaired: false, message: 'Structure OK.' };
  }

  async rebuildBrackets(tid: string = DEFAULT_TOURNAMENT_ID) {
    this.logger.log(`🔄 STARTING EMERGENCY BRACKET REBUILD FOR ${tid}`);
    // 1. Resetear Bracket (Borrar y Crear placeholders limpios)
    await this.seedRound32(tid);

    // 2. Promover Ganadores de Grupos
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    for (const g of groups) {
      await this.tournamentService.promoteFromGroup(g, tid);
    }

    // 3. Promover Terceros
    await this.tournamentService.promoteBestThirds(tid);

    this.logger.log(`✅ EMERGENCY BRACKET REBUILD COMPLETE FOR ${tid}`);
    return { message: `Brackets Rebuilt Cleanly for ${tid}` };
  }

  async fixUCLMatchData() {
    this.logger.log(
      '🔧 [FIX] Running manual fix for UCL Matches tagged as WC2026...',
    );
    const uclTeams = [
      'Manchester City',
      'Juventus',
      'Real Madrid',
      'Benfica',
      'Liverpool',
      'AC Milan',
      'Arsenal',
      'PSV',
      'Atletico Madrid',
      'Club Brugge',
      'Inter Milan',
      'Bayer Leverkusen',
      'Bayern Munich',
      'Sporting CP',
      'PSG',
      'Feyenoord',
    ];

    // Method 1: Update by Home Team
    const res1 = await this.matchesRepository
      .createQueryBuilder()
      .update(Match)
      .set({ tournamentId: 'UCL2526' })
      .where('homeTeam IN (:...teams)', { teams: uclTeams })
      .andWhere("tournamentId = '" + DEFAULT_TOURNAMENT_ID + "'")
      .execute();

    // Method 2: Update by Away Team
    const res2 = await this.matchesRepository
      .createQueryBuilder()
      .update(Match)
      .set({ tournamentId: 'UCL2526' })
      .where('awayTeam IN (:...teams)', { teams: uclTeams })
      .andWhere("tournamentId = '" + DEFAULT_TOURNAMENT_ID + "'")
      .execute();

    const total = (res1.affected || 0) + (res2.affected || 0);
    this.logger.log(`✅ [FIX] Updated ${total} UCL matches found in WC2026.`);

    return {
      message: `Corregidos ${total} partidos de Champions que estaban en Mundial`,
      updated: total,
    };
  }

  async fixEmptyTeamFields() {
    this.logger.log('🔧 [FIX] Fixing empty team fields in knockout matches...');
    const knockoutPhases = [
      'ROUND_32',
      'ROUND_16',
      'QUARTER',
      'SEMI',
      'FINAL',
      '3RD_PLACE',
    ];
    let totalFixed = 0;

    for (const phase of knockoutPhases) {
      const result = await this.matchesRepository
        .createQueryBuilder()
        .update(Match)
        .set({
          homeTeam: 'TBD',
          awayTeam: 'TBD',
        })
        .where('phase = :phase', { phase })
        .andWhere(
          "(homeTeam IS NULL OR homeTeam = '' OR awayTeam IS NULL OR awayTeam = '')",
        )
        .execute();

      totalFixed += result.affected || 0;
      this.logger.log(`✅ [FIX] Fixed ${result.affected || 0} matches in ${phase}`);
    }

    this.logger.log(`✅ [FIX] Total matches fixed: ${totalFixed}`);
    return {
      message: 'Fixed empty team fields',
      totalFixed,
      phases: knockoutPhases,
    };
  }

  // --- ADMIN TEAM MANAGEMENT ---

  async setTeams(matchId: string, homeCode: string, awayCode: string) {
    // Dynamic import based on migration
    const { getTeamInfo } = require('../common/teams-dictionary');

    const match = await this.matchesRepository.findOneBy({ id: matchId });
    if (!match) throw new NotFoundException('Match not found');

    if (homeCode) {
      const home = getTeamInfo(homeCode);
      match.homeTeam = home.name;
      match.homeFlag = home.flag;
      match.homeTeamPlaceholder = null;
    }

    if (awayCode) {
      const away = getTeamInfo(awayCode);
      match.awayTeam = away.name;
      match.awayFlag = away.flag;
      match.awayTeamPlaceholder = null;
    }

    // If both teams are set, we can enable the match
    if (match.homeTeam && match.awayTeam) {
      match.status = 'PENDING';
    }

    const savedMatch = await this.matchesRepository.save(match);

    // 🤖 Emit event for AI prediction generation
    if (match.homeTeam && match.awayTeam) {
      this.eventEmitter.emit('match.teams.assigned', {
        matchId: savedMatch.id,
        homeTeam: savedMatch.homeTeam,
        awayTeam: savedMatch.awayTeam,
      });
      this.logger.log(
        `⚡ Event 'match.teams.assigned' emitted for ${savedMatch.homeTeam} vs ${savedMatch.awayTeam}`,
      );
    }

    return savedMatch;
  }

  async renameTeam(oldName: string, newCode: string) {
    const { getTeamInfo } = require('../common/teams-dictionary');
    const newTeam = getTeamInfo(newCode);

    // Update as Home Team
    await this.matchesRepository
      .createQueryBuilder()
      .update(Match)
      .set({ homeTeam: newTeam.name, homeFlag: newTeam.flag })
      .where('homeTeam = :oldName', { oldName })
      .execute();

    // Update as Away Team
    await this.matchesRepository
      .createQueryBuilder()
      .update(Match)
      .set({ awayTeam: newTeam.name, awayFlag: newTeam.flag })
      .where('awayTeam = :oldName', { oldName })
      .execute();

    return { success: true, oldName, newTeam };
  }

  /**
   * Set manual lock for a match (Admin Kill Switch)
   * @param matchId Match ID
   * @param locked true to lock, false to unlock
   */
  async setManualLock(matchId: string, locked: boolean) {
    const match = await this.matchesRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    match.isManuallyLocked = locked;
    await this.matchesRepository.save(match);

    return {
      message: `Match ${locked ? 'locked 🔒' : 'unlocked 🔓'} successfully`,
      matchId,
      isManuallyLocked: locked,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
    };
  }

  /**
   * Set manual lock for an entire knockout phase
   * @param phase Phase name (ROUND_32, ROUND_16, QUARTER, SEMI, 3RD_PLACE, FINAL)
   * @param locked true to lock, false to unlock
   */
  async setPhaseLock(
    phase: string,
    locked: boolean,
    tournamentId: string = DEFAULT_TOURNAMENT_ID,
  ) {
    const validPhases = [
      'PLAYOFF_1',
      'PLAYOFF_2',
      'ROUND_32',
      'ROUND_16',
      'QUARTER',
      'SEMI',
      '3RD_PLACE',
      'FINAL',
    ];

    if (!validPhases.includes(phase)) {
      throw new NotFoundException(
        `Invalid phase: ${phase}. Valid phases: ${validPhases.join(', ')}`,
      );
    }

    // Find or create phase status
    let phaseStatus = await this.phaseStatusRepository.findOne({
      where: { phase, tournamentId },
    });

    if (!phaseStatus) {
      phaseStatus = this.phaseStatusRepository.create({
        phase,
        tournamentId,
        isManuallyLocked: locked,
        isUnlocked: false,
        allMatchesCompleted: false,
      });
    } else {
      phaseStatus.isManuallyLocked = locked;
    }

    await this.phaseStatusRepository.save(phaseStatus);

    return {
      message: `Phase ${phase} ${locked ? 'locked 🔒' : 'unlocked 🔓'} successfully`,
      phase,
      isManuallyLocked: locked,
    };
  }

  /**
   * Get status of all knockout phases
   */
  async getAllPhaseStatus(tournamentId: string = DEFAULT_TOURNAMENT_ID) {
    const phases =
      tournamentId === 'UCL2526'
        ? ['PLAYOFF_1', 'PLAYOFF_2', 'ROUND_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL']
        : ['ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', '3RD_PLACE', 'FINAL'];

    // Ensure we filter by tournamentId
    const statuses = await this.phaseStatusRepository.find({
      where: { tournamentId },
    });

    // Create a map for easy lookup
    const statusMap = new Map(statuses.map((s) => [s.phase, s]));

    // Return all phases with their status (or default if not found)
    return phases.map((phase) => {
      const status = statusMap.get(phase);
      return {
        phase,
        isManuallyLocked: status?.isManuallyLocked || false,
        isUnlocked: status?.isUnlocked || false,
        allMatchesCompleted: status?.allMatchesCompleted || false,
        tournamentId,
      };
    });
  }

  async fixTestMatches() {
    const tid = 'TEST_LIVE_MONDAY';

    // 1. Update matches to have phase 'GROUP' and set time to Today 9:30 PM (Colombia Time)
    // 9:45 PM Colombia (GMT-5) = 02:45 AM UTC Next Day
    const targetDate = new Date('2026-02-17T02:45:00Z');

    await this.matchesRepository.update(
      { tournamentId: tid },
      {
        phase: 'GROUP',
        date: targetDate,
        status: 'SCHEDULED', // Ensure they are open
        isManuallyLocked: false,
      },
    );

    // 2. Ensure Phase Status exists and is unlocked
    const phaseRepo = this.phaseStatusRepository;
    let phaseStatus = await phaseRepo.findOne({
      where: { tournamentId: tid, phase: 'GROUP' },
    });

    if (!phaseStatus) {
      phaseStatus = phaseRepo.create({
        tournamentId: tid,
        phase: 'GROUP',
        isUnlocked: true,
        allMatchesCompleted: false,
      });
      await phaseRepo.save(phaseStatus);
    } else if (!phaseStatus.isUnlocked) {
      phaseStatus.isUnlocked = true;
      await phaseRepo.save(phaseStatus);
    }

    return '✅ Test matches updated: 9:30 PM & Phase Unlocked.';
  }

  async fixUCLSemis() {
    this.logger.log('🔧 [FIX] Running manual fix for UCL Semis injected schedule...');
    const tournamentId = 'UCL2526';
    const currentPhase = 'SEMI';

    const SEMI_MATCHES = [
      { date: '2026-04-28T19:00:00Z', homeTeam: 'PSG', awayTeam: 'Bayern Munich', homeFlag: 'https://crests.football-data.org/524.svg', awayFlag: 'https://crests.football-data.org/5.svg', group: 'LEG_1', bracketId: 101 },
      { date: '2026-04-29T19:00:00Z', homeTeam: 'Atletico Madrid', awayTeam: 'Arsenal', homeFlag: 'https://crests.football-data.org/78.svg', awayFlag: 'https://crests.football-data.org/57.svg', group: 'LEG_1', bracketId: 102 },
      { date: '2026-05-05T19:00:00Z', homeTeam: 'Arsenal', awayTeam: 'Atletico Madrid', homeFlag: 'https://crests.football-data.org/57.svg', awayFlag: 'https://crests.football-data.org/78.svg', group: 'LEG_2', bracketId: 102 },
      { date: '2026-05-06T19:00:00Z', homeTeam: 'Bayern Munich', awayTeam: 'PSG', homeFlag: 'https://crests.football-data.org/5.svg', awayFlag: 'https://crests.football-data.org/524.svg', group: 'LEG_2', bracketId: 101 }
    ];

    // 1. Force QUARTER and SEMI unlock
    await this.phaseStatusRepository.upsert(
      { phase: 'QUARTER', tournamentId, isUnlocked: true, allMatchesCompleted: true },
      ['phase', 'tournamentId']
    );
    await this.phaseStatusRepository.upsert(
      { phase: 'SEMI', tournamentId, isUnlocked: true, unlockedAt: new Date(), allMatchesCompleted: false },
      ['phase', 'tournamentId']
    );

    let inserted = 0;
    for (const matchData of SEMI_MATCHES) {
      const exists = await this.matchesRepository.findOne({
        where: { homeTeam: matchData.homeTeam, awayTeam: matchData.awayTeam, phase: currentPhase, tournamentId }
      });
      if (!exists) {
        const match = this.matchesRepository.create({
          ...matchData,
          date: new Date(matchData.date),
          phase: currentPhase,
          tournamentId,
          status: 'SCHEDULED'
        });
        await this.matchesRepository.save(match);
        inserted++;
      }
    }

    return { message: `✅ Fases arregladas y ${inserted} partidos de las semifinales insertados.` };
  }
}
