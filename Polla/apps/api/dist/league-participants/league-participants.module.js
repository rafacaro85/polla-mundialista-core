"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeagueParticipantsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const league_participants_service_1 = require("./league-participants.service");
const league_participant_entity_1 = require("../database/entities/league-participant.entity");
const user_entity_1 = require("../database/entities/user.entity");
const league_entity_1 = require("../database/entities/league.entity");
const access_code_entity_1 = require("../database/entities/access-code.entity");
const league_participants_controller_1 = require("./league-participants.controller");
let LeagueParticipantsModule = class LeagueParticipantsModule {
};
exports.LeagueParticipantsModule = LeagueParticipantsModule;
exports.LeagueParticipantsModule = LeagueParticipantsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([league_participant_entity_1.LeagueParticipant, user_entity_1.User, league_entity_1.League, access_code_entity_1.AccessCode])],
        providers: [league_participants_service_1.LeagueParticipantsService],
        controllers: [league_participants_controller_1.LeagueParticipantsController],
        exports: [league_participants_service_1.LeagueParticipantsService],
    })
], LeagueParticipantsModule);
//# sourceMappingURL=league-participants.module.js.map