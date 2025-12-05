"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BracketsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_bracket_entity_1 = require("../database/entities/user-bracket.entity");
const match_entity_1 = require("../database/entities/match.entity");
const league_participant_entity_1 = require("../database/entities/league-participant.entity");
const PHASE_POINTS = {
    'ROUND_16': 3,
    'QUARTER': 6,
    'SEMI': 10,
    'FINAL': 20,
};
let BracketsService = class BracketsService {
    userBracketRepository;
    matchRepository;
    leagueParticipantRepository;
    constructor(userBracketRepository, matchRepository, leagueParticipantRepository) {
        this.userBracketRepository = userBracketRepository;
        this.matchRepository = matchRepository;
        this.leagueParticipantRepository = leagueParticipantRepository;
    }
    async saveBracket(userId, dto) {
        if (dto.leagueId) {
            const participant = await this.leagueParticipantRepository.findOne({
                where: {
                    user: { id: userId },
                    league: { id: dto.leagueId },
                },
            });
            if (participant && participant.isBlocked) {
                throw new common_1.ForbiddenException('No puedes guardar tu bracket porque estás bloqueado en esta liga.');
            }
        }
        const whereClause = { userId };
        if (dto.leagueId) {
            whereClause.leagueId = dto.leagueId;
        }
        else {
            whereClause.leagueId = null;
        }
        let bracket = await this.userBracketRepository.findOne({
            where: whereClause,
        });
        if (bracket) {
            bracket.picks = dto.picks;
            bracket.updatedAt = new Date();
        }
        else {
            bracket = this.userBracketRepository.create({
                userId,
                leagueId: dto.leagueId || undefined,
                picks: dto.picks,
                points: 0,
            });
        }
        return this.userBracketRepository.save(bracket);
    }
    async getMyBracket(userId, leagueId) {
        const whereClause = { userId };
        if (leagueId) {
            whereClause.leagueId = leagueId;
        }
        else {
            whereClause.leagueId = null;
        }
        return this.userBracketRepository.findOne({
            where: whereClause,
        });
    }
    async clearBracket(userId, leagueId) {
        const whereClause = { userId };
        if (leagueId) {
            whereClause.leagueId = leagueId;
        }
        else {
            whereClause.leagueId = null;
        }
        await this.userBracketRepository.delete(whereClause);
        console.log(`🗑️ Bracket cleared for user ${userId}`);
    }
    async calculateBracketPoints(matchId, winnerTeamName) {
        const match = await this.matchRepository.findOne({
            where: { id: matchId },
        });
        if (!match || !match.phase) {
            console.log('Match not found or has no phase:', matchId);
            return;
        }
        const points = PHASE_POINTS[match.phase];
        if (!points) {
            console.log('No points defined for phase:', match.phase);
            return;
        }
        const allBrackets = await this.userBracketRepository.find();
        let updatedCount = 0;
        for (const bracket of allBrackets) {
            if (bracket.picks && bracket.picks[matchId] === winnerTeamName) {
                bracket.points += points;
                await this.userBracketRepository.save(bracket);
                updatedCount++;
                console.log(`✅ Added ${points}pts to user ${bracket.userId} for correct ${match.phase} prediction`);
            }
        }
        console.log(`🏆 Updated ${updatedCount} brackets with ${points}pts for match ${matchId}`);
    }
    async recalculateAllBracketPoints() {
        await this.userBracketRepository.update({}, { points: 0 });
        const finishedMatches = await this.matchRepository.find({
            where: { status: 'FINISHED' },
        });
        console.log(`Recalculating points for ${finishedMatches.length} finished matches...`);
        for (const match of finishedMatches) {
            if (match.homeScore !== null && match.awayScore !== null && match.phase) {
                const winner = match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
                await this.calculateBracketPoints(match.id, winner);
            }
        }
        console.log('✅ Bracket points recalculation complete');
    }
};
exports.BracketsService = BracketsService;
exports.BracketsService = BracketsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_bracket_entity_1.UserBracket)),
    __param(1, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __param(2, (0, typeorm_1.InjectRepository)(league_participant_entity_1.LeagueParticipant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BracketsService);
//# sourceMappingURL=brackets.service.js.map