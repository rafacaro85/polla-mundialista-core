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
exports.ScoringService = void 0;
const common_1 = require("@nestjs/common");
const match_entity_1 = require("../database/entities/match.entity");
const prediction_entity_1 = require("../database/entities/prediction.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let ScoringService = class ScoringService {
    matchesRepository;
    predictionsRepository;
    constructor(matchesRepository, predictionsRepository) {
        this.matchesRepository = matchesRepository;
        this.predictionsRepository = predictionsRepository;
    }
    calculatePoints(match, prediction) {
        if ((match.status !== 'COMPLETED' && match.status !== 'FINISHED') || match.homeScore === null || match.awayScore === null) {
            return 0;
        }
        let points = 0;
        const actualHomeScore = match.homeScore;
        const actualAwayScore = match.awayScore;
        const predictedHomeScore = prediction.homeScore;
        const predictedAwayScore = prediction.awayScore;
        if (actualHomeScore === predictedHomeScore && actualAwayScore === predictedAwayScore) {
            points += 5;
        }
        const actualWinner = Math.sign(actualHomeScore - actualAwayScore);
        const predictedWinner = Math.sign(predictedHomeScore - predictedAwayScore);
        if (actualWinner === predictedWinner) {
            if (Math.abs(actualHomeScore - actualAwayScore) === Math.abs(predictedHomeScore - predictedAwayScore)) {
                if (points < 5) {
                    points += 3;
                }
            }
            else {
                if (points < 3) {
                    points += 1;
                }
            }
        }
        return Math.min(points, 5);
    }
    async calculatePointsForMatch(matchId) {
        const match = await this.matchesRepository.findOne({ where: { id: matchId } });
        if (!match)
            return;
        const predictions = await this.predictionsRepository.find({
            where: { match: { id: matchId } },
            relations: ['user'],
        });
        for (const prediction of predictions) {
            const points = this.calculatePoints(match, prediction);
            prediction.points = points;
            await this.predictionsRepository.save(prediction);
        }
        console.log(`Calculated points for ${predictions.length} predictions for match ${matchId}`);
    }
};
exports.ScoringService = ScoringService;
exports.ScoringService = ScoringService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __param(1, (0, typeorm_1.InjectRepository)(prediction_entity_1.Prediction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ScoringService);
//# sourceMappingURL=scoring.service.js.map