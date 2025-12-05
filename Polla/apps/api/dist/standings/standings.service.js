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
exports.StandingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const match_entity_1 = require("../database/entities/match.entity");
let StandingsService = class StandingsService {
    matchesRepository;
    constructor(matchesRepository) {
        this.matchesRepository = matchesRepository;
    }
    async calculateGroupStandings(group) {
        const matches = await this.matchesRepository.find({
            where: {
                phase: 'GROUP',
                group: group,
                status: 'FINISHED',
            },
        });
        const teamStats = new Map();
        for (const match of matches) {
            if (match.homeScore === null || match.awayScore === null)
                continue;
            if (!teamStats.has(match.homeTeam)) {
                teamStats.set(match.homeTeam, {
                    team: match.homeTeam,
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    goalDifference: 0,
                    points: 0,
                    position: 0,
                });
            }
            if (!teamStats.has(match.awayTeam)) {
                teamStats.set(match.awayTeam, {
                    team: match.awayTeam,
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    goalDifference: 0,
                    points: 0,
                    position: 0,
                });
            }
            const homeTeamStats = teamStats.get(match.homeTeam);
            const awayTeamStats = teamStats.get(match.awayTeam);
            homeTeamStats.played++;
            awayTeamStats.played++;
            homeTeamStats.goalsFor += match.homeScore;
            homeTeamStats.goalsAgainst += match.awayScore;
            awayTeamStats.goalsFor += match.awayScore;
            awayTeamStats.goalsAgainst += match.homeScore;
            if (match.homeScore > match.awayScore) {
                homeTeamStats.won++;
                homeTeamStats.points += 3;
                awayTeamStats.lost++;
            }
            else if (match.homeScore < match.awayScore) {
                awayTeamStats.won++;
                awayTeamStats.points += 3;
                homeTeamStats.lost++;
            }
            else {
                homeTeamStats.drawn++;
                awayTeamStats.drawn++;
                homeTeamStats.points += 1;
                awayTeamStats.points += 1;
            }
            homeTeamStats.goalDifference = homeTeamStats.goalsFor - homeTeamStats.goalsAgainst;
            awayTeamStats.goalDifference = awayTeamStats.goalsFor - awayTeamStats.goalsAgainst;
        }
        const standings = Array.from(teamStats.values());
        standings.sort((a, b) => {
            if (b.points !== a.points)
                return b.points - a.points;
            if (b.goalDifference !== a.goalDifference)
                return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
        standings.forEach((standing, index) => {
            standing.position = index + 1;
        });
        console.log(`📊 Tabla del Grupo ${group}:`);
        standings.forEach(s => {
            console.log(`  ${s.position}. ${s.team}: ${s.points}pts (PJ:${s.played} G:${s.won} E:${s.drawn} P:${s.lost} GF:${s.goalsFor} GC:${s.goalsAgainst} DG:${s.goalDifference})`);
        });
        return standings;
    }
    async getAllGroupStandings() {
        const groups = await this.matchesRepository
            .createQueryBuilder('match')
            .select('DISTINCT match.group', 'group')
            .where('match.phase = :phase', { phase: 'GROUP' })
            .andWhere('match.group IS NOT NULL')
            .getRawMany();
        const allStandings = {};
        for (const { group } of groups) {
            allStandings[group] = await this.calculateGroupStandings(group);
        }
        return allStandings;
    }
};
exports.StandingsService = StandingsService;
exports.StandingsService = StandingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StandingsService);
//# sourceMappingURL=standings.service.js.map