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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeagueParticipant = void 0;
const typeorm_1 = require("typeorm");
const league_entity_1 = require("./league.entity");
const user_entity_1 = require("./user.entity");
let LeagueParticipant = class LeagueParticipant {
    id;
    league;
    user;
    totalPoints;
    currentRank;
    isAdmin;
    isBlocked;
    triviaPoints;
};
exports.LeagueParticipant = LeagueParticipant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LeagueParticipant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => league_entity_1.League),
    (0, typeorm_1.JoinColumn)({ name: 'league_id' }),
    __metadata("design:type", league_entity_1.League)
], LeagueParticipant.prototype, "league", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], LeagueParticipant.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_points', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LeagueParticipant.prototype, "totalPoints", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_rank', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], LeagueParticipant.prototype, "currentRank", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], LeagueParticipant.prototype, "isAdmin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_blocked', default: false }),
    __metadata("design:type", Boolean)
], LeagueParticipant.prototype, "isBlocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trivia_points', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LeagueParticipant.prototype, "triviaPoints", void 0);
exports.LeagueParticipant = LeagueParticipant = __decorate([
    (0, typeorm_1.Entity)({ name: 'league_participants' }),
    (0, typeorm_1.Unique)(['league', 'user'])
], LeagueParticipant);
//# sourceMappingURL=league-participant.entity.js.map