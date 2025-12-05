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
exports.MatchesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const match_entity_1 = require("../database/entities/match.entity");
const prediction_entity_1 = require("../database/entities/prediction.entity");
const scoring_service_1 = require("../scoring/scoring.service");
const brackets_service_1 = require("../brackets/brackets.service");
const tournament_service_1 = require("../tournament/tournament.service");
let MatchesService = class MatchesService {
    matchesRepository;
    predictionsRepository;
    scoringService;
    dataSource;
    bracketsService;
    tournamentService;
    constructor(matchesRepository, predictionsRepository, scoringService, dataSource, bracketsService, tournamentService) {
        this.matchesRepository = matchesRepository;
        this.predictionsRepository = predictionsRepository;
        this.scoringService = scoringService;
        this.dataSource = dataSource;
        this.bracketsService = bracketsService;
        this.tournamentService = tournamentService;
    }
    async findAll(userId) {
        const query = this.matchesRepository.createQueryBuilder('match')
            .leftJoinAndSelect('match.predictions', 'prediction', 'prediction.userId = :userId', { userId })
            .orderBy('match.date', 'ASC');
        return query.getMany();
    }
    async createMatch(data) {
        const newMatch = this.matchesRepository.create({
            ...data,
            homeScore: 0,
            awayScore: 0,
            status: 'NS',
            isLocked: false,
        });
        return this.matchesRepository.save(newMatch);
    }
    async finishMatch(matchId, homeScore, awayScore) {
        const match = await this.matchesRepository.findOne({
            where: { id: matchId },
            relations: ['predictions']
        });
        if (!match) {
            throw new common_1.NotFoundException('Match not found');
        }
        match.status = 'FINISHED';
        match.homeScore = homeScore;
        match.awayScore = awayScore;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.save(match);
            const predictionsToUpdate = [];
            if (match.predictions) {
                for (const prediction of match.predictions) {
                    const points = this.scoringService.calculatePoints(match, prediction);
                    prediction.points = points;
                    predictionsToUpdate.push(prediction);
                }
            }
            if (predictionsToUpdate.length > 0) {
                await queryRunner.manager.save(predictionsToUpdate);
            }
            await queryRunner.commitTransaction();
            const winner = homeScore > awayScore ? match.homeTeam : match.awayTeam;
            await this.bracketsService.calculateBracketPoints(matchId, winner);
            console.log(`🏆 Bracket points calculated for match ${matchId}, winner: ${winner}`);
            if (match.phase === 'GROUP' && match.group) {
                this.tournamentService.promoteFromGroup(match.group)
                    .catch(err => console.error(`❌ Error promoting from group ${match.group}:`, err));
            }
            return match;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateMatch(id, data) {
        const match = await this.matchesRepository.findOne({
            where: { id },
            relations: ['predictions']
        });
        if (!match) {
            throw new common_1.NotFoundException('Match not found');
        }
        const wasNotFinished = match.status !== 'FINISHED';
        if (data.status !== undefined)
            match.status = data.status;
        if (data.homeScore !== undefined)
            match.homeScore = data.homeScore;
        if (data.awayScore !== undefined)
            match.awayScore = data.awayScore;
        if (data.phase !== undefined)
            match.phase = data.phase;
        if (data.group !== undefined)
            match.group = data.group;
        if (data.homeTeamPlaceholder !== undefined)
            match.homeTeamPlaceholder = data.homeTeamPlaceholder;
        if (data.awayTeamPlaceholder !== undefined)
            match.awayTeamPlaceholder = data.awayTeamPlaceholder;
        if (data.homeTeam !== undefined)
            match.homeTeam = data.homeTeam;
        if (data.awayTeam !== undefined)
            match.awayTeam = data.awayTeam;
        if (data.date !== undefined)
            match.date = data.date;
        if (data.bracketId !== undefined)
            match.bracketId = data.bracketId;
        if (data.nextMatchId !== undefined)
            match.nextMatchId = data.nextMatchId;
        if (data.isLocked !== undefined)
            match.isLocked = data.isLocked;
        const savedMatch = await this.matchesRepository.save(match);
        if (wasNotFinished && match.status === 'FINISHED' &&
            match.homeScore !== null && match.awayScore !== null) {
            const predictionsToUpdate = [];
            if (match.predictions) {
                for (const prediction of match.predictions) {
                    const points = this.scoringService.calculatePoints(match, prediction);
                    prediction.points = points;
                    predictionsToUpdate.push(prediction);
                }
            }
            if (predictionsToUpdate.length > 0) {
                await this.predictionsRepository.save(predictionsToUpdate);
                console.log(`✅ Recalculated points for ${predictionsToUpdate.length} predictions in match ${id}`);
            }
            const winner = match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
            await this.bracketsService.calculateBracketPoints(id, winner);
            console.log(`🏆 Bracket points calculated for match ${id}, winner: ${winner}`);
            if (match.phase === 'GROUP' && match.group) {
                this.tournamentService.promoteFromGroup(match.group)
                    .catch(err => console.error(`❌ Error promoting from group ${match.group}:`, err));
            }
        }
        return savedMatch;
    }
    async seedKnockoutMatches() {
        const existingKnockout = await this.matchesRepository.count({
            where: { phase: 'ROUND_16' },
        });
        if (existingKnockout > 0) {
            return {
                message: `Ya existen ${existingKnockout} partidos de octavos. No se crearon nuevos.`,
                created: 0,
            };
        }
        const baseDate = new Date('2026-07-01T16:00:00Z');
        const knockoutMatches = [
            { homeTeamPlaceholder: '1A', awayTeamPlaceholder: '2B', phase: 'ROUND_16', bracketId: 1, date: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1C', awayTeamPlaceholder: '2D', phase: 'ROUND_16', bracketId: 2, date: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1E', awayTeamPlaceholder: '2F', phase: 'ROUND_16', bracketId: 3, date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1G', awayTeamPlaceholder: '2H', phase: 'ROUND_16', bracketId: 4, date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1B', awayTeamPlaceholder: '2A', phase: 'ROUND_16', bracketId: 5, date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1D', awayTeamPlaceholder: '2C', phase: 'ROUND_16', bracketId: 6, date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1F', awayTeamPlaceholder: '2E', phase: 'ROUND_16', bracketId: 7, date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1H', awayTeamPlaceholder: '2G', phase: 'ROUND_16', bracketId: 8, date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
        ];
        for (const matchData of knockoutMatches) {
            const match = this.matchesRepository.create({
                ...matchData,
                homeTeam: '',
                awayTeam: '',
                homeScore: null,
                awayScore: null,
                status: 'PENDING',
            });
            await this.matchesRepository.save(match);
        }
        return {
            message: `Se crearon ${knockoutMatches.length} partidos de octavos exitosamente.`,
            created: knockoutMatches.length,
        };
    }
    async resetKnockoutMatches() {
        const knockoutMatches = await this.matchesRepository.find({
            where: { phase: 'ROUND_16' },
        });
        if (knockoutMatches.length === 0) {
            return {
                message: 'No hay partidos de octavos para resetear.',
                reset: 0,
            };
        }
        const placeholderMap = {
            1: { home: '1A', away: '2B' },
            2: { home: '1C', away: '2D' },
            3: { home: '1E', away: '2F' },
            4: { home: '1G', away: '2H' },
            5: { home: '1B', away: '2A' },
            6: { home: '1D', away: '2C' },
            7: { home: '1F', away: '2E' },
            8: { home: '1H', away: '2G' },
        };
        let resetCount = 0;
        for (const match of knockoutMatches) {
            const bracketId = match.bracketId || 0;
            const placeholders = placeholderMap[bracketId];
            if (placeholders) {
                match.homeTeam = '';
                match.awayTeam = '';
                match.homeTeamPlaceholder = placeholders.home;
                match.awayTeamPlaceholder = placeholders.away;
                match.homeScore = null;
                match.awayScore = null;
                match.status = 'PENDING';
                await this.matchesRepository.save(match);
                resetCount++;
            }
        }
        return {
            message: `Se resetearon ${resetCount} partidos de octavos a sus placeholders originales.`,
            reset: resetCount,
        };
    }
};
exports.MatchesService = MatchesService;
exports.MatchesService = MatchesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __param(1, (0, typeorm_1.InjectRepository)(prediction_entity_1.Prediction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        scoring_service_1.ScoringService,
        typeorm_2.DataSource,
        brackets_service_1.BracketsService,
        tournament_service_1.TournamentService])
], MatchesService);
//# sourceMappingURL=matches.service.js.map