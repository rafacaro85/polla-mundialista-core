import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { Match } from '../database/entities/match.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { SaveBracketDto } from './dto/save-bracket.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PHASE_POINTS = {
  ROUND_32: 2,
  PLAYOFF_1: 2,
  PLAYOFF_2: 2,
  ROUND_16: 3,
  QUARTER: 6,
  SEMI: 10,
  '3RD_PLACE': 15,
  FINAL: 20,
};

@Injectable()
export class BracketsService {
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
    // Check for 'global' string and treat as null
    // Also validate if it is a valid UUID, otherwise null
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

      if (participant && participant.isBlocked) {
        throw new ForbiddenException(
          'No puedes guardar tu bracket porque estás bloqueado en esta liga.',
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
      // ✅ NEW: Validate bracket is not locked (manual or automatic)
      await this.validateBracketNotLocked(dto.picks, tournamentId);

      // Find existing bracket or create new one
      const whereClause: any = { userId, tournamentId };
      if (targetLeagueId) {
        whereClause.leagueId = targetLeagueId;
      } else {
        whereClause.leagueId = IsNull(); // IMPORTANT: Explicit IsNull checks
      }

      let bracket = await this.userBracketRepository.findOne({
        where: whereClause,
      });

      if (bracket) {
        // Update existing bracket
        bracket.picks = dto.picks;
        bracket.updatedAt = new Date();
      } else {
        // Create new bracket
        bracket = this.userBracketRepository.create({
          userId,
          leagueId: targetLeagueId || undefined, // FIX: Use sanitized leagueId (handles 'global' -> null) instead of raw dto.leagueId
          tournamentId,
          picks: dto.picks,
          points: 0,
        });
      }
      return await this.userBracketRepository.save(bracket);
    } catch (error) {
      console.error('Error saving bracket:', error);
      throw error;
    }
  }

  /**
   * Validates that the bracket is not locked (manual or automatic)
   * Checks all phases that have picks in the bracket
   */
  private async validateBracketNotLocked(
    picks: Record<string, string>,
    tournamentId: string,
  ): Promise<void> {
    if (!picks || Object.keys(picks).length === 0) {
      return; // Empty bracket, nothing to validate
    }

    // Get all match IDs from picks
    // FILTER: Only valid UUIDs to prevent DB errors
    const matchIds = Object.keys(picks).filter((id) => UUID_REGEX.test(id));

    if (matchIds.length === 0) {
      return; // No valid match IDs found
    }

    // Get all matches involved
    const matches = await this.matchRepository.find({
      where: matchIds.map((id) => ({ id })),
    });

    if (matches.length === 0) {
      return; // No matches found, nothing to validate
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

    return leagueBracket || generalBracket || null;
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
      whereClause.leagueId = IsNull(); // IMPORTANT: Explicit IsNull for global
    }

    if (tournamentId) {
      whereClause.tournamentId = tournamentId;
    }

    await this.userBracketRepository.delete(whereClause);
    console.log(
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
      console.log('Match not found or has no phase:', matchId);
      return;
    }

    // Get points for this phase
    const points = PHASE_POINTS[match.phase as keyof typeof PHASE_POINTS];
    if (!points) {
      console.log('No points defined for phase:', match.phase);
      return;
    }

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
      console.log(
        `✅ Bulk updated ${bracketsToUpdate.length} brackets for ${match.phase} prediction`,
      );
    }

    console.log(
      `🏆 Updated ${bracketsToUpdate.length} brackets with ${points}pts for match ${matchId}`,
    );
  }

  async recalculateAllBracketPoints(): Promise<void> {
    console.log('🔄 Starting bracket points recalculation...');
    try {
      // 1. Reset all points to 0
      // TypeORM prevents update({}) for safety. We use QueryBuilder for global update.
      await this.userBracketRepository
        .createQueryBuilder()
        .update(UserBracket)
        .set({ points: 0 })
        .execute();
      console.log('✅ Points reset to 0 for all brackets');

      // 2. Get all finished matches
      const finishedMatches = await this.matchRepository.find({
        where: { status: 'FINISHED' },
      });
      console.log(
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
          console.error(
            `❌ Error processing match ${match.id} (${match.homeTeam} vs ${match.awayTeam}):`,
            matchError,
          );
        }
      }

      console.log(
        `✅ Bracket points recalculation complete. Processed ${processedCount} matches.`,
      );
    } catch (error) {
      console.error('🔥 FATAL ERROR in recalculateAllBracketPoints:', error);
      throw new InternalServerErrorException(
        `Failed to recalculate bracket points: ${error.message}`,
      );
    }
  }
}
