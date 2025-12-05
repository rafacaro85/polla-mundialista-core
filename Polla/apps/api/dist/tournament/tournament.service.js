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
var TournamentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const match_entity_1 = require("../database/entities/match.entity");
const standings_service_1 = require("../standings/standings.service");
let TournamentService = TournamentService_1 = class TournamentService {
    matchesRepository;
    standingsService;
    logger = new common_1.Logger(TournamentService_1.name);
    constructor(matchesRepository, standingsService) {
        this.matchesRepository = matchesRepository;
        this.standingsService = standingsService;
    }
    async isGroupComplete(group) {
        const totalMatches = await this.matchesRepository.count({
            where: { phase: 'GROUP', group },
        });
        const finishedMatches = await this.matchesRepository.count({
            where: { phase: 'GROUP', group, status: 'FINISHED' },
        });
        return totalMatches > 0 && totalMatches === finishedMatches;
    }
    getPlaceholderMapping() {
        const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const mapping = {};
        for (const group of groups) {
            mapping[`1${group}`] = { group, position: 1 };
            mapping[`2${group}`] = { group, position: 2 };
        }
        return mapping;
    }
    async promoteFromGroup(group) {
        this.logger.log(`🔄 Checking promotion for Group ${group}...`);
        const isComplete = await this.isGroupComplete(group);
        if (!isComplete) {
            this.logger.log(`⏳ Group ${group} is not complete yet. Skipping promotion.`);
            return;
        }
        const standings = await this.standingsService.calculateGroupStandings(group);
        if (standings.length < 2) {
            this.logger.warn(`⚠️ Group ${group} has less than 2 teams. Cannot promote.`);
            return;
        }
        const firstPlace = standings[0].team;
        const secondPlace = standings[1].team;
        this.logger.log(`📊 Group ${group} standings: 1st: ${firstPlace}, 2nd: ${secondPlace}`);
        const groupMatches = await this.matchesRepository.find({
            where: { phase: 'GROUP', group },
        });
        let firstPlaceFlag = null;
        let secondPlaceFlag = null;
        for (const match of groupMatches) {
            if (match.homeTeam === firstPlace && match.homeFlag) {
                firstPlaceFlag = match.homeFlag;
            }
            else if (match.awayTeam === firstPlace && match.awayFlag) {
                firstPlaceFlag = match.awayFlag;
            }
            if (match.homeTeam === secondPlace && match.homeFlag) {
                secondPlaceFlag = match.homeFlag;
            }
            else if (match.awayTeam === secondPlace && match.awayFlag) {
                secondPlaceFlag = match.awayFlag;
            }
        }
        this.logger.log(`🏁 Flags found - ${firstPlace}: ${firstPlaceFlag}, ${secondPlace}: ${secondPlaceFlag}`);
        const knockoutMatches = await this.matchesRepository.find({
            where: { phase: 'ROUND_16' },
        });
        let updatedCount = 0;
        for (const match of knockoutMatches) {
            let updated = false;
            if (match.homeTeamPlaceholder === `1${group}` && match.homeTeam !== firstPlace) {
                match.homeTeam = firstPlace;
                match.homeFlag = firstPlaceFlag || '';
                match.homeTeamPlaceholder = null;
                updated = true;
                this.logger.log(`✅ Updated match ${match.id}: homeTeam = ${firstPlace} (flag: ${firstPlaceFlag})`);
            }
            else if (match.homeTeamPlaceholder === `2${group}` && match.homeTeam !== secondPlace) {
                match.homeTeam = secondPlace;
                match.homeFlag = secondPlaceFlag || '';
                match.homeTeamPlaceholder = null;
                updated = true;
                this.logger.log(`✅ Updated match ${match.id}: homeTeam = ${secondPlace} (flag: ${secondPlaceFlag})`);
            }
            if (match.awayTeamPlaceholder === `1${group}` && match.awayTeam !== firstPlace) {
                match.awayTeam = firstPlace;
                match.awayFlag = firstPlaceFlag || '';
                match.awayTeamPlaceholder = null;
                updated = true;
                this.logger.log(`✅ Updated match ${match.id}: awayTeam = ${firstPlace} (flag: ${firstPlaceFlag})`);
            }
            else if (match.awayTeamPlaceholder === `2${group}` && match.awayTeam !== secondPlace) {
                match.awayTeam = secondPlace;
                match.awayFlag = secondPlaceFlag || '';
                match.awayTeamPlaceholder = null;
                updated = true;
                this.logger.log(`✅ Updated match ${match.id}: awayTeam = ${secondPlace} (flag: ${secondPlaceFlag})`);
            }
            if (updated) {
                await this.matchesRepository.save(match);
                updatedCount++;
            }
        }
        if (updatedCount > 0) {
            this.logger.log(`🎉 Promotion complete for Group ${group}. Updated ${updatedCount} knockout matches.`);
        }
        else {
            this.logger.log(`ℹ️ No updates needed for Group ${group} (already promoted or no matching placeholders).`);
        }
    }
    async promoteAllCompletedGroups() {
        const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        for (const group of groups) {
            try {
                await this.promoteFromGroup(group);
            }
            catch (error) {
                this.logger.error(`❌ Error promoting Group ${group}:`, error);
            }
        }
    }
};
exports.TournamentService = TournamentService;
exports.TournamentService = TournamentService = TournamentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        standings_service_1.StandingsService])
], TournamentService);
//# sourceMappingURL=tournament.service.js.map