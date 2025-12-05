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
var MatchSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchSyncService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const match_entity_1 = require("../database/entities/match.entity");
const scoring_service_1 = require("../scoring/scoring.service");
const rxjs_1 = require("rxjs");
let MatchSyncService = MatchSyncService_1 = class MatchSyncService {
    httpService;
    matchesRepository;
    scoringService;
    logger = new common_1.Logger(MatchSyncService_1.name);
    constructor(httpService, matchesRepository, scoringService) {
        this.httpService = httpService;
        this.matchesRepository = matchesRepository;
        this.scoringService = scoringService;
    }
    async syncLiveMatches() {
        this.logger.log('Sincronizando partidos en vivo...');
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get('/fixtures', {
                params: { live: 'all' },
            }));
            const fixtures = data.response;
            if (!fixtures || fixtures.length === 0) {
                this.logger.log('No hay partidos en vivo en este momento.');
                return;
            }
            let updatedCount = 0;
            for (const fixture of fixtures) {
                const externalId = fixture.fixture.id;
                const statusShort = fixture.fixture.status.short;
                const homeScore = fixture.goals.home;
                const awayScore = fixture.goals.away;
                const match = await this.matchesRepository.findOne({ where: { externalId } });
                if (!match) {
                    continue;
                }
                if (match.isLocked) {
                    this.logger.log(`Partido ${match.id} (Ext: ${externalId}) está bloqueado manualmente. Saltando.`);
                    continue;
                }
                match.homeScore = homeScore;
                match.awayScore = awayScore;
                if (['FT', 'AET', 'PEN'].includes(statusShort)) {
                    if (match.status !== 'COMPLETED') {
                        match.status = 'COMPLETED';
                        await this.matchesRepository.save(match);
                        this.logger.log(`Partido ${match.id} finalizado. Calculando puntos...`);
                        await this.scoringService.calculatePointsForMatch(match.id);
                    }
                }
                else {
                    if (match.status !== 'LIVE' && match.status !== 'COMPLETED') {
                        match.status = 'LIVE';
                    }
                    await this.matchesRepository.save(match);
                }
                updatedCount++;
            }
            if (updatedCount > 0) {
                this.logger.log(`Sincronización completada. ${updatedCount} partidos actualizados.`);
            }
        }
        catch (error) {
            this.logger.error('Error sincronizando partidos', error);
        }
    }
};
exports.MatchSyncService = MatchSyncService;
__decorate([
    (0, schedule_1.Cron)('*/1 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MatchSyncService.prototype, "syncLiveMatches", null);
exports.MatchSyncService = MatchSyncService = MatchSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        typeorm_2.Repository,
        scoring_service_1.ScoringService])
], MatchSyncService);
//# sourceMappingURL=match-sync.service.js.map