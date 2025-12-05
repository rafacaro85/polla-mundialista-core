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
exports.BonusQuestion = void 0;
const typeorm_1 = require("typeorm");
const league_entity_1 = require("./league.entity");
let BonusQuestion = class BonusQuestion {
    id;
    text;
    points;
    correctAnswer;
    isActive;
    createdAt;
    updatedAt;
    league;
    leagueId;
};
exports.BonusQuestion = BonusQuestion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BonusQuestion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BonusQuestion.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BonusQuestion.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BonusQuestion.prototype, "correctAnswer", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], BonusQuestion.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BonusQuestion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], BonusQuestion.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => league_entity_1.League, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'league_id' }),
    __metadata("design:type", league_entity_1.League)
], BonusQuestion.prototype, "league", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'league_id', nullable: true }),
    __metadata("design:type", String)
], BonusQuestion.prototype, "leagueId", void 0);
exports.BonusQuestion = BonusQuestion = __decorate([
    (0, typeorm_1.Entity)('bonus_questions')
], BonusQuestion);
//# sourceMappingURL=bonus-question.entity.js.map