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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBonusAnswer = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const bonus_question_entity_1 = require("./bonus-question.entity");
let UserBonusAnswer = class UserBonusAnswer {
    id;
    user;
    userId;
    question;
    questionId;
    answer;
    pointsEarned;
    createdAt;
    updatedAt;
};
exports.UserBonusAnswer = UserBonusAnswer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserBonusAnswer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], UserBonusAnswer.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserBonusAnswer.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bonus_question_entity_1.BonusQuestion, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'questionId' }),
    __metadata("design:type", bonus_question_entity_1.BonusQuestion)
], UserBonusAnswer.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserBonusAnswer.prototype, "questionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserBonusAnswer.prototype, "answer", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], UserBonusAnswer.prototype, "pointsEarned", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], UserBonusAnswer.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], UserBonusAnswer.prototype, "updatedAt", void 0);
exports.UserBonusAnswer = UserBonusAnswer = __decorate([
    (0, typeorm_1.Entity)('user_bonus_answers')
], UserBonusAnswer);
//# sourceMappingURL=user-bonus-answer.entity.js.map