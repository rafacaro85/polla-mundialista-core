import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { GradeQuestionDto } from './dto/grade-question.dto';

import { League } from '../database/entities/league.entity';
import { LeagueType } from '../database/enums/league-type.enum';

@Injectable()
export class BonusService {
    constructor(
        @InjectRepository(BonusQuestion)
        private bonusQuestionRepository: Repository<BonusQuestion>,
        @InjectRepository(UserBonusAnswer)
        private userBonusAnswerRepository: Repository<UserBonusAnswer>,
        @InjectRepository(League)
        private leagueRepository: Repository<League>,
    ) { }

    // Admin: Crear pregunta
    async createQuestion(dto: CreateQuestionDto): Promise<BonusQuestion> {
        const question = this.bonusQuestionRepository.create(dto);

        // Si no se especifica liga, asignar a la liga GLOBAL (General)
        if (!dto.leagueId) {
            const globalLeague = await this.leagueRepository.findOne({ where: { type: LeagueType.GLOBAL } });
            if (globalLeague) {
                question.leagueId = globalLeague.id;
            }
        }

        return this.bonusQuestionRepository.save(question);
    }

    // Listar preguntas activas filtradas por liga
    async getActiveQuestions(leagueId?: string): Promise<BonusQuestion[]> {
        const where: any = { isActive: true };
        if (leagueId) {
            where.leagueId = leagueId;
        } else {
            // Si no hay liga, buscamos la GLOBAL por defecto para la vista general
            const globalLeague = await this.leagueRepository.findOne({ where: { type: LeagueType.GLOBAL } });
            if (globalLeague) {
                where.leagueId = globalLeague.id;
            }
        }

        return this.bonusQuestionRepository.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }

    // Listar todas las preguntas (admin)
    async getAllQuestions(): Promise<BonusQuestion[]> {
        return this.bonusQuestionRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    // Usuario: Guardar/actualizar respuesta
    async saveAnswer(userId: string, dto: SaveAnswerDto): Promise<UserBonusAnswer> {
        const question = await this.bonusQuestionRepository.findOne({
            where: { id: dto.questionId },
        });

        if (!question) {
            throw new NotFoundException('Pregunta no encontrada');
        }

        if (!question.isActive) {
            throw new BadRequestException('Esta pregunta ya no está activa');
        }

        // Verificar si ya respondió
        let userAnswer = await this.userBonusAnswerRepository.findOne({
            where: {
                userId,
                questionId: dto.questionId,
            },
        });

        if (userAnswer) {
            // Actualizar respuesta existente
            userAnswer.answer = dto.answer;
            // Resetear puntos si la pregunta ya fue calificada
            if (question.correctAnswer) {
                userAnswer.pointsEarned = this.calculatePoints(dto.answer, question.correctAnswer, question.points);
            }
        } else {
            // Crear nueva respuesta
            userAnswer = this.userBonusAnswerRepository.create({
                userId,
                questionId: dto.questionId,
                answer: dto.answer,
                pointsEarned: 0,
            });
        }

        return this.userBonusAnswerRepository.save(userAnswer);
    }

    // Obtener respuestas del usuario filtradas por liga
    async getUserAnswers(userId: string, leagueId?: string): Promise<UserBonusAnswer[]> {
        const query = this.userBonusAnswerRepository.createQueryBuilder('answer')
            .leftJoinAndSelect('answer.question', 'question')
            .where('answer.userId = :userId', { userId });

        if (leagueId) {
            query.andWhere('question.leagueId = :leagueId', { leagueId });
        } else {
            const globalLeague = await this.leagueRepository.findOne({ where: { type: LeagueType.GLOBAL } });
            if (globalLeague) {
                query.andWhere('question.leagueId = :leagueId', { leagueId: globalLeague.id });
            }
        }

        return query.getMany();
    }

    // Admin: Calificar pregunta
    async gradeQuestion(questionId: string, dto: GradeQuestionDto): Promise<{ updated: number }> {
        const question = await this.bonusQuestionRepository.findOne({
            where: { id: questionId },
        });

        if (!question) {
            throw new NotFoundException('Pregunta no encontrada');
        }

        // Actualizar la respuesta correcta
        question.correctAnswer = dto.correctAnswer;
        question.isActive = false; // Cerrar la pregunta
        await this.bonusQuestionRepository.save(question);

        // Obtener todas las respuestas para esta pregunta
        const answers = await this.userBonusAnswerRepository.find({
            where: { questionId },
        });

        let updatedCount = 0;

        // Calificar cada respuesta
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

    // Calcular puntos (case-insensitive comparison)
    private calculatePoints(userAnswer: string, correctAnswer: string, points: number): number {
        const normalizedUserAnswer = userAnswer.toLowerCase().trim();
        const normalizedCorrectAnswer = correctAnswer.toLowerCase().trim();

        return normalizedUserAnswer === normalizedCorrectAnswer ? points : 0;
    }

    // Admin: Eliminar pregunta
    async deleteQuestion(questionId: string): Promise<void> {
        const question = await this.bonusQuestionRepository.findOne({
            where: { id: questionId },
        });

        if (!question) {
            throw new NotFoundException('Pregunta no encontrada');
        }

        // Eliminar respuestas asociadas
        await this.userBonusAnswerRepository.delete({ questionId });

        // Eliminar pregunta
        await this.bonusQuestionRepository.delete(questionId);
    }

    // Admin: Actualizar pregunta
    async updateQuestion(questionId: string, dto: CreateQuestionDto): Promise<BonusQuestion> {
        const question = await this.bonusQuestionRepository.findOne({
            where: { id: questionId },
        });

        if (!question) {
            throw new NotFoundException('Pregunta no encontrada');
        }

        question.text = dto.text;
        question.points = dto.points;
        // No actualizamos la liga aquí para evitar cambios accidentales

        return this.bonusQuestionRepository.save(question);
    }
}
