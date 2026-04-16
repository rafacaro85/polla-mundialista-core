import { Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException, Logger } from '@nestjs/common';;
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { Match } from '../database/entities/match.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { LeagueParticipantStatus } from '../database/enums/league-participant-status.enum';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { SaveBracketDto } from './dto/save-bracket.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


@Injectable()
export class BracketsService {
  private readonly logger = new Logger(BracketsService.name);

  constructor(
    @InjectRepository(UserBracket)
    private userBracketRepository: Repository<UserBracket>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(LeagueParticipant)
    private leagueParticipantRepository: Repository<LeagueParticipant>,
    @InjectRepository(KnockoutPhaseStatus)
    private knockoutPhaseStatusRepository: Repository<KnockoutPhaseStatus>,
  ) {}

  async saveBracket(userId: string, dto: SaveBracketDto): Promise<UserBracket> {
    // Normalize leagueId: treat 'global' or invalid UUIDs as null
    let targetLeagueId = null;
    if (
      dto.leagueId &&
      dto.leagueId !== 'global' &&
      UUID_REGEX.test(dto.leagueId)
    ) {
      targetLeagueId = dto.leagueId;
    }

    // Check if user is blocked in the league (if leagueId is provided)
    if (targetLeagueId) {
      const participant = await this.leagueParticipantRepository.findOne({
        where: {
          user: { id: userId },
          league: { id: targetLeagueId },
        },
      });

      if (
        participant &&
        (participant.isBlocked ||
          participant.status === LeagueParticipantStatus.PENDING)
      ) {
        throw new ForbiddenException(
          'No puedes guardar tu bracket porque tu estado es PENDIENTE o BLOQUEADO en esta liga.',
        );
      }
    }

    // Determine tournamentId from picks if not provided
    let tournamentId = dto.tournamentId;
    if (!tournamentId && Object.keys(dto.picks).length > 0) {
      const firstMatchId = Object.keys(dto.picks)[0];
      const match = await this.matchRepository.findOne({
        where: { id: firstMatchId },
      });
      if (match) tournamentId = match.tournamentId;
    }
    tournamentId = tournamentId || 'WC2026'; // Final fallback

    try {
      // Find existing bracket first so we can diff the picks
      const whereClause: any = { userId, tournamentId };
      if (targetLeagueId) {
        whereClause.leagueId = targetLeagueId;
      } else {
        whereClause.leagueId = IsNull();
      }

      let bracket = await this.userBracketRepository.findOne({
        where: whereClause,
      });

      const oldPicks = bracket?.picks || {};

      // Validate bracket is not locked (only checks matches that CHANGED)
      await this.validateBracketNotLocked(dto.picks, oldPicks, tournamentId);

      if (bracket) {
        // Update existing bracket
        bracket.picks = dto.picks;
        bracket.updatedAt = new Date();
      } else {
        // Create new bracket per league (or global if no leagueId)
        bracket = this.userBracketRepository.create({
          userId,
          leagueId: targetLeagueId || undefined,
          tournamentId,
          picks: dto.picks,
          points: 0,
        });
      }
      return await this.userBracketRepository.save(bracket);
    } catch (error) {
      this.logger.error('Error saving bracket:', error);
      throw error;
    }
  }

  /**
   * Validates that the bracket is not locked (manual or automatic)
   * Checks all phases that have picks in the bracket
   */
  private async validateBracketNotLocked(
    newPicks: Record<string, string>,
    oldPicks: Record<string, string>,
    tournamentId: string,
  ): Promise<void> {
    if (!newPicks || Object.keys(newPicks).length === 0) {
      return; // Empty bracket, nothing to validate
    }

    // Determine WHICH matches actually changed
    const changedMatchIds: string[] = [];
    for (const matchId of Object.keys(newPicks)) {
      if (oldPicks[matchId] !== newPicks[matchId]) {
        changedMatchIds.push(matchId);
      }
    }

    // If the user hasn't changed any picks from their last save, allow it immediately
    if (changedMatchIds.length === 0) {
      return;
    }

    // Use only matches where predictions changed
    const rawIds = changedMatchIds;
    this.logger.log(
      `[DEBUG] SaveBracket - Changed Keys (${rawIds.length}):`,
      rawIds.slice(0, 3),
    ); // Log first 3

    // FILTER: Only valid UUIDs to prevent DB errors
    const matchIds = rawIds.filter((id) => {
      const isValid = UUID_REGEX.test(id);
      if (!isValid) this.logger.warn(`[WARN] Invalid UUID filtered: ${id}`);
      return isValid;
    });

    this.logger.log(
      `[DEBUG] SaveBracket - Valid UUIDs: ${matchIds.length} / ${rawIds.length}`,
    );

    if (matchIds.length === 0) {
      this.logger.warn(
        '[WARN] SaveBracket - No valid match IDs found after filtering.',
      );
      if (rawIds.length > 0) {
        throw new BadRequestException(
          `No se encontraron IDs de partido válidos. IDs recibidos: ${rawIds.join(', ')}`,
        );
      }
      return; // Empty picks originally
    }

    // Get all matches involved
    const matches = await this.matchRepository.find({
      where: matchIds.map((id) => ({ id })),
    });

    if (matches.length === 0) {
      this.logger.warn(
        `[WARN] SaveBracket - ALL ${matchIds.length} match IDs were rejected (not found in DB). First ID: ${matchIds[0]}`,
      );
      throw new BadRequestException(
        `Los partidos seleccionados ya no son válidos (el torneo se ha actualizado). Por favor recarga la página para obtener los nuevos partidos.`,
      );
    }

    if (matches.length < matchIds.length) {
      this.logger.warn(
        `[WARN] SaveBracket - Partial mismatch. Received ${matchIds.length}, found ${matches.length}.`,
      );
      // Opcional: Podríamos lanzar error aquí también si queremos consistencia estricta
    }

    // Get unique phases from matches
    const phases = [...new Set(matches.map((m) => m.phase).filter(Boolean))];

    // Define phase order (earliest to latest)
    const PHASE_ORDER = [
      'ROUND_32',
      'ROUND_16',
      'QUARTER',
      'SEMI',
      '3RD_PLACE',
      'FINAL',
    ];

    // Get the earliest phase
    const earliestPhase = phases.sort((a, b) => {
      return PHASE_ORDER.indexOf(a) - PHASE_ORDER.indexOf(b);
    })[0];

    if (!earliestPhase) {
      return; // No valid phase found
    }

    // 1. Check manual lock for the earliest phase
    const phaseStatus = await this.knockoutPhaseStatusRepository.findOne({
      where: { phase: earliestPhase, tournamentId: tournamentId },
    });

    if (phaseStatus?.isManuallyLocked) {
      throw new ForbiddenException(
        `La fase ${earliestPhase} ha sido bloqueada manualmente por el administrador. No se pueden guardar brackets.`,
      );
    }

    // 2. Check automatic time-based lock (10 minutes before first match of earliest phase)
    const firstMatchOfPhase = await this.matchRepository.findOne({
      where: { phase: earliestPhase, tournamentId: tournamentId },
      order: { date: 'ASC' },
    });

    if (firstMatchOfPhase) {
      const now = new Date();
      const matchDate = new Date(firstMatchOfPhase.date);
      const lockTime = new Date(matchDate.getTime() - 10 * 60 * 1000); // 10 minutes before

      if (now >= lockTime) {
        throw new ForbiddenException(
          `Ya no se pueden guardar brackets para la fase ${earliestPhase}. El bloqueo automático se activó 10 minutos antes del primer partido.`,
        );
      }
    }
  }

  async getMyBracket(
    userId: string,
    leagueId?: string,
    tournamentId: string = 'WC2026', // Default for backward compatibility
  ): Promise<UserBracket | null> {
    // Normalize 'global' string to undefined/null logic
    const targetLeagueId =
      leagueId === 'global' || leagueId === '' ? undefined : leagueId;

    if (!targetLeagueId) {
      return this.userBracketRepository.findOne({
        where: { userId, leagueId: IsNull(), tournamentId },
      });
    }

    // Smart Fallback: Intentar traer el de la liga, si no existe, traer el general (NULL)
    // Filter by tournamentId to avoid cross-contamination
    const brackets = await this.userBracketRepository.find({
      where: { userId, tournamentId },
    });

    const leagueBracket = brackets.find((b) => b.leagueId === targetLeagueId);
    const generalBracket = brackets.find((b) => b.leagueId === null);

    // Smart Fallback: use league bracket if it exists, else use global (leagueId=NULL)
    // IMPORTANT: We do NOT prioritize the bracket with more points,
    // because showing a different bracket than the one scored for this league is misleading.
    let result: UserBracket | undefined;

    if (leagueBracket) {
      result = leagueBracket;  // Always prefer the league-specific bracket
    } else {
      result = generalBracket; // Fall back to global only if no league bracket exists
    }

    if (!result) {
      return {
        userId,
        tournamentId,
        leagueId: targetLeagueId || null,
        picks: {},
        points: 0,
        id: 'virtual-empty',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as UserBracket;
    }

    return result;
  }

  async clearBracket(
    userId: string,
    leagueId?: string,
    tournamentId?: string,
  ): Promise<void> {
    const whereClause: any = { userId };
    if (leagueId) {
      whereClause.leagueId = leagueId;
    } else {
      whereClause.leagueId = IsNull();
    }

    if (tournamentId) {
      whereClause.tournamentId = tournamentId;
    }

    await this.userBracketRepository.delete(whereClause);
    this.logger.log(
      `🗑️ Bracket cleared for user ${userId} in tournament ${tournamentId}`,
    );
  }

  async calculateBracketPoints(
    matchId: string,
    winnerTeamName: string,
  ): Promise<void> {
    // Get match to determine phase
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match || !match.phase) {
      this.logger.log('Match not found or has no phase:', matchId);
      return;
    }

    // Normalization: Todos los aciertos de bracket valen 2 puntos, sin importar la fase.
    const points = 2;

    // Find all brackets that predicted this winner for this match AND belong to the same tournament
    const allBrackets = await this.userBracketRepository.find({
      where: { tournamentId: match.tournamentId },
    });
    const bracketsToUpdate: UserBracket[] = [];

    for (const bracket of allBrackets) {
      // Check if this bracket has a pick for this match
      if (bracket.picks && bracket.picks[matchId] === winnerTeamName) {
        // User predicted correctly! Add points
        bracket.points += points;
        bracketsToUpdate.push(bracket);
      }
    }

    if (bracketsToUpdate.length > 0) {
      await this.userBracketRepository.save(bracketsToUpdate);
      this.logger.log(
        `✅ Bulk updated ${bracketsToUpdate.length} brackets for ${match.phase} prediction`,
      );
    }

    this.logger.log(
      `🏆 Updated ${bracketsToUpdate.length} brackets with ${points}pts for match ${matchId}`,
    );
  }

  async recalculateAllBracketPoints(): Promise<void> {
    this.logger.log('🔄 Starting bracket points recalculation...');
    try {
      // 1. Reset all points to 0
      // TypeORM prevents update({}) for safety. We use QueryBuilder for global update.
      await this.userBracketRepository
        .createQueryBuilder()
        .update(UserBracket)
        .set({ points: 0 })
        .execute();
      this.logger.log('✅ Points reset to 0 for all brackets');

      // 2. Get all finished matches
      const finishedMatches = await this.matchRepository.find({
        where: { status: 'FINISHED' },
      });
      this.logger.log(
        `📊 Found ${finishedMatches.length} finished matches to process`,
      );

      // 3. Process each match
      let processedCount = 0;
      for (const match of finishedMatches) {
        try {
          // Skip if scores are missing or phase is not relevant (e.g. GROUP)
          if (
            match.homeScore !== null &&
            match.awayScore !== null &&
            match.phase
          ) {
            // Determine winner
            const winner =
              match.homeScore > match.awayScore
                ? match.homeTeam
                : match.awayTeam;

            // We put this in a try-catch to prevent one bad match from stopping the whole process
            await this.calculateBracketPoints(match.id, winner);
            processedCount++;
          }
        } catch (matchError) {
          this.logger.error(
            `❌ Error processing match ${match.id} (${match.homeTeam} vs ${match.awayTeam}):`,
            matchError,
          );
        }
      }

      this.logger.log(
        `✅ Bracket points recalculation complete. Processed ${processedCount} matches.`,
      );
    } catch (error) {
      this.logger.error('🔥 FATAL ERROR in recalculateAllBracketPoints:', error);
      throw new InternalServerErrorException(
        `Failed to recalculate bracket points: ${error.message}`,
      );
    }
  }
}
