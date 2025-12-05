"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const matches_controller_1 = require("./matches.controller");
const matches_service_1 = require("./matches.service");
const match_entity_1 = require("../database/entities/match.entity");
const prediction_entity_1 = require("../database/entities/prediction.entity");
const scoring_module_1 = require("../scoring/scoring.module");
const brackets_module_1 = require("../brackets/brackets.module");
const tournament_module_1 = require("../tournament/tournament.module");
const axios_1 = require("@nestjs/axios");
const schedule_1 = require("@nestjs/schedule");
const match_sync_service_1 = require("./match-sync.service");
let MatchesModule = class MatchesModule {
};
exports.MatchesModule = MatchesModule;
exports.MatchesModule = MatchesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([match_entity_1.Match, prediction_entity_1.Prediction]),
            brackets_module_1.BracketsModule,
            tournament_module_1.TournamentModule,
            scoring_module_1.ScoringModule,
            axios_1.HttpModule.register({
                baseURL: 'https://v3.football.api-sports.io',
                headers: {
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                    'x-rapidapi-host': process.env.RAPIDAPI_HOST,
                },
            }),
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [matches_controller_1.MatchesController],
        providers: [matches_service_1.MatchesService, match_sync_service_1.MatchSyncService],
    })
], MatchesModule);
//# sourceMappingURL=matches.module.js.map