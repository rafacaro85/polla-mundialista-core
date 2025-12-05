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
exports.BonusService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bonus_question_entity_1 = require("../database/entities/bonus-question.entity");
const user_bonus_answer_entity_1 = require("../database/entities/user-bonus-answer.entity");
const league_entity_1 = require("../database/entities/league.entity");
const league_type_enum_1 = require("../database/enums/league-type.enum");
let BonusService = class BonusService {
    bonusQuestionRepository;
    userBonusAnswerRepository;
    leagueRepository;
    constructor(bonusQuestionRepository, userBonusAnswerRepository, leagueRepository) {
        this.bonusQuestionRepository = bonusQuestionRepository;
        this.userBonusAnswerRepository = userBonusAnswerRepository;
        this.leagueRepository = leagueRepository;
    }
    async createQuestion(dto) {
        const question = this.bonusQuestionRepository.create(dto);
        if (!dto.leagueId) {
            const globalLeague = await this.leagueRepository.findOne({ where: { type: league_type_enum_1.LeagueType.GLOBAL } });
            if (globalLeague) {
                question.leagueId = globalLeague.id;
            }
        }
        return this.bonusQuestionRepository.save(question);
    }
    async getActiveQuestions() {
        return this.bonusQuestionRepository.find({
            where: { isActive: true },
            order: { createdAt: 'DESC' },
        });
    }
    async getAllQuestions() {
        return this.bonusQuestionRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async saveAnswer(userId, dto) {
        const question = await this.bonusQuestionRepository.findOne({
            where: { id: dto.questionId },
        });
        if (!question) {
            throw new common_1.NotFoundException('Pregunta no encontrada');
        }
        if (!question.isActive) {
            throw new common_1.BadRequestException('Esta pregunta ya no está activa');
        }
        let userAnswer = await this.userBonusAnswerRepository.findOne({
            where: {
                userId,
                questionId: dto.questionId,
            },
        });
        if (userAnswer) {
            userAnswer.answer = dto.answer;
            if (question.correctAnswer) {
                userAnswer.pointsEarned = this.calculatePoints(dto.answer, question.correctAnswer, question.points);
            }
        }
        else {
            userAnswer = this.userBonusAnswerRepository.create({
                userId,
                questionId: dto.questionId,
                answer: dto.answer,
                pointsEarned: 0,
            });
        }
        return this.userBonusAnswerRepository.save(userAnswer);
    }
    async getUserAnswers(userId) {
        return this.userBonusAnswerRepository.find({
            where: { userId },
            relations: ['question'],
        });
    }
    async gradeQuestion(questionId, dto) {
        const question = await this.bonusQuestionRepository.findOne({
            where: { id: questionId },
        });
        if (!question) {
            throw new common_1.NotFoundException('Pregunta no encontrada');
        }
        question.correctAnswer = dto.correctAnswer;
        question.isActive = false;
        await this.bonusQuestionRepository.save(question);
        const answers = await this.userBonusAnswerRepository.find({
            where: { questionId },
        });
        let updatedCount = 0;
        for (const answer of answers) {
            const points = this.calculatePoints(answer.answer, dto.correctAnswer, question.points);
            if (points !== answer.pointsEarned) {
                answer.pointsEarned = points;
                await this.userBonusAnswerRepository.save(answer);
                updatedCount++;
            }
        }
        console.log(`✅ Graded question "${question.text}". Updated ${updatedCount} answers.`);
        return { updated: updatedCount };
    }
    calculatePoints(userAnswer, correctAnswer, points) {
        const normalizedUserAnswer = userAnswer.toLowerCase().trim();
        const normalizedCorrectAnswer = correctAnswer.toLowerCase().trim();
        return normalizedUserAnswer === normalizedCorrectAnswer ? points : 0;
    }
    async deleteQuestion(questionId) {
        const question = await this.bonusQuestionRepository.findOne({
            where: { id: questionId },
        });
        if (!question) {
            throw new common_1.NotFoundException('Pregunta no encontrada');
        }
        await this.userBonusAnswerRepository.delete({ questionId });
        await this.bonusQuestionRepository.delete(questionId);
    }
    async updateQuestion(questionId, dto) {
        const question = await this.bonusQuestionRepository.findOne({
            where: { id: questionId },
        });
        if (!question) {
            throw new common_1.NotFoundException('Pregunta no encontrada');
        }
        question.text = dto.text;
        question.points = dto.points;
        return this.bonusQuestionRepository.save(question);
    }
};
exports.BonusService = BonusService;
exports.BonusService = BonusService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bonus_question_entity_1.BonusQuestion)),
    __param(1, (0, typeorm_1.InjectRepository)(user_bonus_answer_entity_1.UserBonusAnswer)),
    __param(2, (0, typeorm_1.InjectRepository)(league_entity_1.League)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BonusService);
//# sourceMappingURL=bonus.service.js.map