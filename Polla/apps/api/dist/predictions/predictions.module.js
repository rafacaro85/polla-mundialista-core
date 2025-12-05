"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const predictions_controller_1 = require("./predictions.controller");
const predictions_service_1 = require("./predictions.service");
const prediction_entity_1 = require("../database/entities/prediction.entity");
const match_entity_1 = require("../database/entities/match.entity");
const league_participant_entity_1 = require("../database/entities/league-participant.entity");
let PredictionsModule = class PredictionsModule {
};
exports.PredictionsModule = PredictionsModule;
exports.PredictionsModule = PredictionsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([prediction_entity_1.Prediction, match_entity_1.Match, league_participant_entity_1.LeagueParticipant])],
        controllers: [predictions_controller_1.PredictionsController],
        providers: [predictions_service_1.PredictionsService],
    })
], PredictionsModule);
//# sourceMappingURL=predictions.module.js.map