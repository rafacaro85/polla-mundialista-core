import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
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
        @InjectRepository(LeagueParticipant) // Inyectado
        private leagueParticipantRepository: Repository<LeagueParticipant>,
    ) { }

    // Helper: Verificar permisos de admin sobre una liga
    async checkLeagueAdminPermission(userId: string, leagueId: string | undefined, userGlobalRole: string): Promise<boolean> {
        // 1. Super Admin siempre puede
        if (userGlobalRole === 'SUPER_ADMIN') return true;

        if (!leagueId) return false; // Solo Super Admin puede tocar Globales

        // 2. Verificar si es Creator o Admin Local
        const league = await this.leagueRepository.findOne({ 
            where: { id: leagueId },
            relations: ['creator']
        });

        if (!league) throw new NotFoundException('Liga no encontrada');

        // Es el creador?
        if (league.creator && league.creator.id === userId) return true;

        // Es participante Admin?
        const participant = await this.leagueParticipantRepository.findOne({
            where: { league: { id: leagueId }, user: { id: userId } }
        });

        if (participant && participant.isAdmin) return true;

        return false;
    }

    // Admin: Crear pregunta
    async createQuestion(dto: CreateQuestionDto): Promise<BonusQuestion> {
        const question = this.bonusQuestionRepository.create(dto);
        
        // Asignar tournamentId del DTO o default
        if (dto.tournamentId) {
            question.tournamentId = dto.tournamentId;
        }

        // Si no se especifica liga, asignar a la liga GLOBAL (General)
        if (!dto.leagueId) {
            const globalLeague = await this.leagueRepository.findOne({ where: { type: LeagueType.GLOBAL } });
            if (globalLeague) {
                question.leagueId = globalLeague.id;
            }
        }

        return this.bonusQuestionRepository.save(question);
    }

    // Listar preguntas activas filtradas por liga y torneo
    async getActiveQuestions(leagueId?: string, tournamentId?: string): Promise<BonusQuestion[]> {
        const where: any = { isActive: true };
        
        if (tournamentId) {
            where.tournamentId = tournamentId;
        }

        if (leagueId) {
            where.leagueId = leagueId;
        } else {
            // Si no hay liga, buscamos la GLOBAL por defecto para la vista general
            const globalLeague = await this.leagueRepository.findOne({ where: { type: LeagueType.GLOBAL } });
            if (globalLeague) {
                where.leagueId = globalLeague.id;
            } else {
                where.leagueId = IsNull();
            }
        }

        return this.bonusQuestionRepository.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }

    // Listar todas las preguntas (admin) - Filtradas por liga
    async getAllQuestions(leagueId?: string, tournamentId?: string): Promise<BonusQuestion[]> {
        const where: any = {};
        
        if (tournamentId) {
            where.tournamentId = tournamentId;
        }

        if (leagueId) {
            where.leagueId = leagueId;
        } else {
            // Si es global admin pidiendo todo... o global questions
            where.leagueId = IsNull();
        }

        return this.bonusQuestionRepository.find({
            where,
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
            } else {
                query.andWhere('question.leagueId IS NULL');
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

    // Normalizar texto para comparación flexible
    private normalizeText(text: string): string {
        if (!text) return '';
        return text
            .normalize("NFD") // Descomponer acentos
            .replace(/[\u0300-\u036f]/g, "") // Eliminar marcas diacríticas
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, "") // Eliminar símbolos raros, dejar letras, números y espacios
            .replace(/\s+/g, " ") // Colapsar espacios múltiples
            .trim();
    }

    // Calcular puntos (Fuzzy Matching: Inclusión + Normalización)
    private calculatePoints(userAnswer: string, correctAnswer: string, points: number): number {
        const u = this.normalizeText(userAnswer);
        const c = this.normalizeText(correctAnswer);

        // 1. Coincidencia Exacta Normalizada
        if (u === c) return points;

        // 2. Coincidencia Parcial (Inclusión)
        // Solo si la respuesta correcta tiene longitud suficiente para evitar falsos positivos
        // (ej: "No" vs "No se")
        if (c.length > 3 && u.length > 2) {
            // Si la respuesta del usuario contiene la correcta (ej: "El ganador es Messi" contiene "Messi")
            if (u.includes(c)) return points;
            
            // Si la respuesta correcta contiene la del usuario (ej: "Lionel Messi" contiene "Messi")
            if (c.includes(u)) return points;
        }

        return 0;
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
