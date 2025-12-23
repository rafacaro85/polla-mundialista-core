import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { Match } from '../database/entities/match.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { SaveBracketDto } from './dto/save-bracket.dto';

const PHASE_POINTS = {
    'ROUND_32': 2,
    'ROUND_16': 3,
    'QUARTER': 6,
    'SEMI': 10,
    'FINAL': 20,
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
    ) { }

    async saveBracket(userId: string, dto: SaveBracketDto): Promise<UserBracket> {
        // 1. Check if user is blocked in the league (if leagueId is provided)
        if (dto.leagueId) {
            const participant = await this.leagueParticipantRepository.findOne({
                where: {
                    user: { id: userId },
                    league: { id: dto.leagueId },
                },
            });

            if (participant && participant.isBlocked) {
                throw new ForbiddenException('No puedes guardar tu bracket porque estás bloqueado en esta liga.');
            }
        }

        // Find existing bracket or create new one
        const whereClause: any = { userId };
        if (dto.leagueId) {
            whereClause.leagueId = dto.leagueId;
        } else {
            whereClause.leagueId = null;
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
                leagueId: dto.leagueId || undefined,
                picks: dto.picks,
                points: 0,
            });
        }

        return this.userBracketRepository.save(bracket);
    }

    async getMyBracket(userId: string, leagueId?: string): Promise<UserBracket | null> {
        const whereClause: any = { userId };
        if (leagueId) {
            whereClause.leagueId = leagueId;
        } else {
            whereClause.leagueId = null;
        }

        return this.userBracketRepository.findOne({
            where: whereClause,
        });
    }

    async clearBracket(userId: string, leagueId?: string): Promise<void> {
        const whereClause: any = { userId };
        if (leagueId) {
            whereClause.leagueId = leagueId;
        } else {
            whereClause.leagueId = null;
        }

        await this.userBracketRepository.delete(whereClause);
        console.log(`🗑️ Bracket cleared for user ${userId}`);
    }

    async calculateBracketPoints(matchId: string, winnerTeamName: string): Promise<void> {
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

        // Find all brackets that predicted this winner for this match
        const allBrackets = await this.userBracketRepository.find();

        let updatedCount = 0;
        for (const bracket of allBrackets) {
            // Check if this bracket has a pick for this match
            if (bracket.picks && bracket.picks[matchId] === winnerTeamName) {
                // User predicted correctly! Add points
                bracket.points += points;
                await this.userBracketRepository.save(bracket);
                updatedCount++;
                console.log(`✅ Added ${points}pts to user ${bracket.userId} for correct ${match.phase} prediction`);
            }
        }

        console.log(`🏆 Updated ${updatedCount} brackets with ${points}pts for match ${matchId}`);
    }

    async recalculateAllBracketPoints(): Promise<void> {
        // Reset all bracket points
        await this.userBracketRepository.update({}, { points: 0 });

        // Get all finished matches
        const finishedMatches = await this.matchRepository.find({
            where: { status: 'FINISHED' },
        });

        console.log(`Recalculating points for ${finishedMatches.length} finished matches...`);

        for (const match of finishedMatches) {
            if (match.homeScore !== null && match.awayScore !== null && match.phase) {
                // Determine winner
                const winner = match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
                await this.calculateBracketPoints(match.id, winner);
            }
        }

        console.log('✅ Bracket points recalculation complete');
    }
}
