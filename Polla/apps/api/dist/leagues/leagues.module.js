"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaguesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const leagues_service_1 = require("./leagues.service");
const leagues_controller_1 = require("./leagues.controller");
const league_entity_1 = require("../database/entities/league.entity");
const league_participant_entity_1 = require("../database/entities/league-participant.entity");
const user_entity_1 = require("../database/entities/user.entity");
const access_code_entity_1 = require("../database/entities/access-code.entity");
const access_codes_service_1 = require("../access-codes/access-codes.service");
const league_participants_service_1 = require("../league-participants/league-participants.service");
const transactions_module_1 = require("../transactions/transactions.module");
const pdf_module_1 = require("../common/pdf/pdf.module");
let LeaguesModule = class LeaguesModule {
};
exports.LeaguesModule = LeaguesModule;
exports.LeaguesModule = LeaguesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([league_entity_1.League, league_participant_entity_1.LeagueParticipant, user_entity_1.User, access_code_entity_1.AccessCode]),
            transactions_module_1.TransactionsModule,
            pdf_module_1.PdfModule,
        ],
        providers: [leagues_service_1.LeaguesService, access_codes_service_1.AccessCodesService, league_participants_service_1.LeagueParticipantsService],
        controllers: [leagues_controller_1.LeaguesController],
        exports: [leagues_service_1.LeaguesService],
    })
], LeaguesModule);
//# sourceMappingURL=leagues.module.js.map