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
exports.PredictionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const prediction_entity_1 = require("../database/entities/prediction.entity");
const match_entity_1 = require("../database/entities/match.entity");
const league_participant_entity_1 = require("../database/entities/league-participant.entity");
let PredictionsService = class PredictionsService {
    predictionsRepository;
    matchesRepository;
    leagueParticipantRepository;
    constructor(predictionsRepository, matchesRepository, leagueParticipantRepository) {
        this.predictionsRepository = predictionsRepository;
        this.matchesRepository = matchesRepository;
        this.leagueParticipantRepository = leagueParticipantRepository;
    }
    async upsertPrediction(userId, matchId, homeScore, awayScore, leagueId) {
        if (leagueId) {
            const participant = await this.leagueParticipantRepository.findOne({
                where: {
                    user: { id: userId },
                    league: { id: leagueId },
                },
            });
            if (participant && participant.isBlocked) {
                throw new common_1.ForbiddenException('No puedes realizar predicciones porque estás bloqueado en esta liga.');
            }
        }
        const match = await this.matchesRepository.findOne({ where: { id: matchId } });
        if (!match) {
            throw new common_1.NotFoundException('Match not found');
        }
        if (match.date < new Date()) {
            throw new common_1.BadRequestException('Cannot predict on a match that has already started');
        }
        let prediction = await this.predictionsRepository.findOne({
            where: {
                user: { id: userId },
                match: { id: matchId },
            },
        });
        if (prediction) {
            prediction.homeScore = homeScore;
            prediction.awayScore = awayScore;
        }
        else {
            prediction = this.predictionsRepository.create({
                user: { id: userId },
                match: { id: matchId },
                homeScore,
                awayScore,
            });
        }
        return this.predictionsRepository.save(prediction);
    }
    async findAllByUser(userId) {
        return this.predictionsRepository.find({
            where: { user: { id: userId } },
            relations: ['match'],
        });
    }
};
exports.PredictionsService = PredictionsService;
exports.PredictionsService = PredictionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(prediction_entity_1.Prediction)),
    __param(1, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __param(2, (0, typeorm_1.InjectRepository)(league_participant_entity_1.LeagueParticipant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PredictionsService);
//# sourceMappingURL=predictions.service.js.map