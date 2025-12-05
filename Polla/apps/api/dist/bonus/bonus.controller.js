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
exports.BonusController = void 0;
const common_1 = require("@nestjs/common");
const bonus_service_1 = require("./bonus.service");
const create_question_dto_1 = require("./dto/create-question.dto");
const save_answer_dto_1 = require("./dto/save-answer.dto");
const grade_question_dto_1 = require("./dto/grade-question.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let BonusController = class BonusController {
    bonusService;
    constructor(bonusService) {
        this.bonusService = bonusService;
    }
    async createQuestion(dto) {
        return this.bonusService.createQuestion(dto);
    }
    async getActiveQuestions() {
        return this.bonusService.getActiveQuestions();
    }
    async getAllQuestions() {
        return this.bonusService.getAllQuestions();
    }
    async saveAnswer(req, dto) {
        return this.bonusService.saveAnswer(req.user.id, dto);
    }
    async getMyAnswers(req) {
        return this.bonusService.getUserAnswers(req.user.id);
    }
    async gradeQuestion(questionId, dto) {
        return this.bonusService.gradeQuestion(questionId, dto);
    }
    async deleteQuestion(questionId) {
        await this.bonusService.deleteQuestion(questionId);
        return { message: 'Pregunta eliminada exitosamente' };
    }
    async updateQuestion(questionId, dto) {
        return this.bonusService.updateQuestion(questionId, dto);
    }
};
exports.BonusController = BonusController;
__decorate([
    (0, common_1.Post)('questions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_question_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "createQuestion", null);
__decorate([
    (0, common_1.Get)('questions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "getActiveQuestions", null);
__decorate([
    (0, common_1.Get)('questions/all'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "getAllQuestions", null);
__decorate([
    (0, common_1.Post)('answer'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, save_answer_dto_1.SaveAnswerDto]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "saveAnswer", null);
__decorate([
    (0, common_1.Get)('my-answers'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "getMyAnswers", null);
__decorate([
    (0, common_1.Post)('grade/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, grade_question_dto_1.GradeQuestionDto]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "gradeQuestion", null);
__decorate([
    (0, common_1.Delete)('questions/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "deleteQuestion", null);
__decorate([
    (0, common_1.Put)('questions/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_question_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "updateQuestion", null);
exports.BonusController = BonusController = __decorate([
    (0, common_1.Controller)('bonus'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [bonus_service_1.BonusService])
], BonusController);
//# sourceMappingURL=bonus.controller.js.map