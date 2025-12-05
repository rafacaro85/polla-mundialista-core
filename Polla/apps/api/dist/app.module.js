"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const scoring_module_1 = require("./scoring/scoring.module");
const leagues_module_1 = require("./leagues/leagues.module");
const access_codes_module_1 = require("./access-codes/access-codes.module");
const league_participants_module_1 = require("./league-participants/league-participants.module");
const matches_module_1 = require("./matches/matches.module");
const predictions_module_1 = require("./predictions/predictions.module");
const brackets_module_1 = require("./brackets/brackets.module");
const bonus_module_1 = require("./bonus/bonus.module");
const standings_module_1 = require("./standings/standings.module");
const tournament_module_1 = require("./tournament/tournament.module");
const transactions_module_1 = require("./transactions/transactions.module");
const organization_entity_1 = require("./database/entities/organization.entity");
const user_entity_1 = require("./database/entities/user.entity");
const league_entity_1 = require("./database/entities/league.entity");
const league_participant_entity_1 = require("./database/entities/league-participant.entity");
const access_code_entity_1 = require("./database/entities/access-code.entity");
const match_entity_1 = require("./database/entities/match.entity");
const prediction_entity_1 = require("./database/entities/prediction.entity");
const user_bracket_entity_1 = require("./database/entities/user-bracket.entity");
const bonus_question_entity_1 = require("./database/entities/bonus-question.entity");
const user_bonus_answer_entity_1 = require("./database/entities/user-bonus-answer.entity");
const transaction_entity_1 = require("./database/entities/transaction.entity");
const system_config_entity_1 = require("./database/entities/system-config.entity");
const system_setting_entity_1 = require("./system-settings/entities/system-setting.entity");
const system_settings_module_1 = require("./system-settings/system-settings.module");
const upload_module_1 = require("./upload/upload.module");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST'),
                    port: parseInt(configService.get('DB_PORT'), 10),
                    username: configService.get('DB_USERNAME'),
                    password: configService.get('DB_PASSWORD'),
                    database: configService.get('DB_DATABASE'),
                    entities: [
                        organization_entity_1.Organization,
                        user_entity_1.User,
                        league_entity_1.League,
                        league_participant_entity_1.LeagueParticipant,
                        access_code_entity_1.AccessCode,
                        match_entity_1.Match,
                        prediction_entity_1.Prediction,
                        user_bracket_entity_1.UserBracket,
                        bonus_question_entity_1.BonusQuestion,
                        user_bonus_answer_entity_1.UserBonusAnswer,
                        transaction_entity_1.Transaction,
                        system_config_entity_1.SystemConfig,
                        system_setting_entity_1.SystemSettings,
                    ],
                    synchronize: true,
                }),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            auth_module_1.AuthModule,
            scoring_module_1.ScoringModule,
            leagues_module_1.LeaguesModule,
            access_codes_module_1.AccessCodesModule,
            league_participants_module_1.LeagueParticipantsModule,
            matches_module_1.MatchesModule,
            predictions_module_1.PredictionsModule,
            brackets_module_1.BracketsModule,
            bonus_module_1.BonusModule,
            standings_module_1.StandingsModule,
            tournament_module_1.TournamentModule,
            transactions_module_1.TransactionsModule,
            system_settings_module_1.SystemSettingsModule,
            upload_module_1.UploadModule,
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map