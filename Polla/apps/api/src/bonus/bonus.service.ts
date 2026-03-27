import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, In } from 'typeorm';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { GradeQuestionDto } from './dto/grade-question.dto';

import { League } from '../database/entities/league.entity';
import { LeagueType } from '../database/enums/league-type.enum';
import { LeagueParticipantStatus } from '../database/enums/league-participant-status.enum';

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
  ) {}

  // Helper: Verificar permisos de admin sobre una liga
  async checkLeagueAdminPermission(
    userId: string,
    leagueId: string | undefined,
    userGlobalRole: string,
  ): Promise<boolean> {
    // 1. Super Admin siempre puede
    if (userGlobalRole === 'SUPER_ADMIN') return true;

    if (!leagueId) return false; // Solo Super Admin puede tocar Globales

    // 2. Verificar si es Creator o Admin Local
    const league = await this.leagueRepository.findOne({
      where: { id: leagueId },
      relations: ['creator'],
    });

    if (!league) throw new NotFoundException('Liga no encontrada');

    // Es el creador?
    if (league.creator && league.creator.id === userId) return true;

    // Es participante Admin?
    const participant = await this.leagueParticipantRepository.findOne({
      where: { league: { id: leagueId }, user: { id: userId } },
    });

    if (participant && participant.isAdmin) return true;

    return false;
  }

  // Admin: Crear pregunta
  async createQuestion(dto: CreateQuestionDto): Promise<BonusQuestion> {
    const question = this.bonusQuestionRepository.create(dto);

    // Si no se especifica leagueId ni tournamentId, es una pregunta global del torneo actual
    if (!dto.leagueId) {
      const globalLeague = await this.leagueRepository.findOne({
        where: {
          type: LeagueType.GLOBAL,
          tournamentId: dto.tournamentId || 'WC2026',
        },
      });
      if (globalLeague) {
        question.leagueId = globalLeague.id;
      }
    }

    // Garantizar que isActive sea true si no se especifica
    if (dto.isActive === undefined) {
      question.isActive = true;
    }

    return this.bonusQuestionRepository.save(question);
  }

  // Listar preguntas activas filtradas por liga y torneo
  async getActiveQuestions(
    leagueId?: string,
    tournamentId?: string,
  ): Promise<BonusQuestion[]> {
    console.log(
      `🔍 [BonusService] getActiveQuestions - leagueId: ${leagueId}, tournamentId: ${tournamentId}`,
    );

    const conditions: any[] = [];
    const tId = tournamentId || 'WC2026';

    // 1. Siempre buscamos preguntas de la liga GLOBAL para este torneo
    const globalLeague = await this.leagueRepository.findOne({
      where: { type: LeagueType.GLOBAL, tournamentId: tId },
    });

    if (globalLeague) {
      conditions.push({
        leagueId: globalLeague.id,
        tournamentId: tId,
      });
    }

    // 2. Si se especifica una liga, sumamos las preguntas de esa liga
    if (leagueId && (!globalLeague || globalLeague.id !== leagueId)) {
      conditions.push({ leagueId, tournamentId: tId });
    }

    // Si no hay condiciones (ej. no hay global league y no pasaron leagueId), buscamos por tournamentId general
    if (conditions.length === 0) {
      conditions.push({
        tournamentId: tId,
        leagueId: IsNull(),
      });
    }

    console.log('🔍 [BonusService] conditions:', JSON.stringify(conditions));
    const results = await this.bonusQuestionRepository.find({
      where: conditions,
      order: { 
        isActive: 'DESC',
        createdAt: 'DESC' 
      },
    });
    console.log(`🔍 [BonusService] found: ${results.length} questions`);
    return results;
  }

  // Listar todas las preguntas (admin) - Filtradas por liga
  async getAllQuestions(
    leagueId?: string,
    tournamentId?: string,
  ): Promise<BonusQuestion[]> {
    console.log(
      `🔍 [BonusService] getAllQuestions - leagueId: ${leagueId}, tournamentId: ${tournamentId}`,
    );
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

    console.log('🔍 [BonusService] getAll where:', JSON.stringify(where));
    const results = await this.bonusQuestionRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
    console.log(`🔍 [BonusService] getAll found: ${results.length} questions`);
    return results;
  }

  // Usuario: Guardar/actualizar respuesta
  async saveAnswer(
    userId: string,
    dto: SaveAnswerDto,
  ): Promise<UserBonusAnswer> {
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
        userAnswer.pointsEarned = this.calculatePoints(
          dto.answer,
          question.correctAnswer,
          question.points,
        );
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
  async getUserAnswers(
    userId: string,
    leagueId?: string,
  ): Promise<UserBonusAnswer[]> {
    const query = this.userBonusAnswerRepository
      .createQueryBuilder('answer')
      .leftJoinAndSelect('answer.question', 'question')
      .where('answer.userId = :userId', { userId });

    if (leagueId) {
      query.andWhere('question.leagueId = :leagueId', { leagueId });
    } else {
      const globalLeague = await this.leagueRepository.findOne({
        where: { type: LeagueType.GLOBAL },
      });
      if (globalLeague) {
        query.andWhere('question.leagueId = :leagueId', {
          leagueId: globalLeague.id,
        });
      } else {
        query.andWhere('question.leagueId IS NULL');
      }
    }

    return query.getMany();
  }

  // Admin: Calificar pregunta
  async gradeQuestion(
    questionId: string,
    dto: GradeQuestionDto,
  ): Promise<{ updated: number }> {
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
      const points = this.calculatePoints(
        answer.answer,
        dto.correctAnswer,
        question.points,
      );
      if (points !== answer.pointsEarned) {
        answer.pointsEarned = points;
        await this.userBonusAnswerRepository.save(answer);
        updatedCount++;
      }
    }

    console.log(
      `✅ Graded question "${question.text}". Updated ${updatedCount} answers.`,
    );

    return { updated: updatedCount };
  }

  // Normalizar texto para comparación flexible
  private normalizeText(text: string): string {
    if (!text) return '';
    return text
      .normalize('NFD') // Descomponer acentos
      .replace(/[\u0300-\u036f]/g, '') // Eliminar marcas diacríticas
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '') // Eliminar símbolos raros, dejar letras, números y espacios
      .replace(/\s+/g, ' ') // Colapsar espacios múltiples
      .trim();
  }

  // Calcular puntos (Fuzzy Matching: Inclusión + Normalización)
  private calculatePoints(
    userAnswer: string,
    correctAnswer: string,
    points: number,
  ): number {
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
  async updateQuestion(
    questionId: string,
    dto: CreateQuestionDto,
  ): Promise<BonusQuestion> {
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

  async getLeagueAnswers(requesterId: string, leagueId: string) {
    // 1. Validar participación
    const participantRes = await this.leagueParticipantRepository.findOne({
      where: { league: { id: leagueId }, user: { id: requesterId } },
    });
    if (!participantRes) {
      throw new ForbiddenException('No eres participante de esta liga');
    }

    // 2. Obtener preguntas calificadas (league-specific + global)
    const currentLeague = await this.leagueRepository.findOne({ where: { id: leagueId } });
    if (!currentLeague) throw new NotFoundException('Liga no encontrada');

    const globalLeague = await this.leagueRepository.findOne({
      where: { type: LeagueType.GLOBAL, tournamentId: currentLeague.tournamentId || 'WC2026' },
    });

    const conditions: any[] = [
      { leagueId: leagueId, correctAnswer: Not(IsNull()) }
    ];
    if (globalLeague) {
      conditions.push({ leagueId: globalLeague.id, correctAnswer: Not(IsNull()) });
    }

    const gradedQuestions = await this.bonusQuestionRepository.find({
      where: conditions,
    });

    if (gradedQuestions.length === 0) return [];

    const questionIds = gradedQuestions.map(q => q.id);

    // 3. Obtener todas las respuestas para esas preguntas en esa liga
    const participants = await this.leagueParticipantRepository.find({
      where: { league: { id: leagueId }, status: LeagueParticipantStatus.ACTIVE },
      relations: ['user'],
    });

    const userIds = participants.map(p => p.user.id);
    if (userIds.length === 0) return [];

    const answers = await this.userBonusAnswerRepository.find({
      where: {
        questionId: In(questionIds),
        userId: In(userIds),
      },
      relations: ['question'],
    });

    // 4. Transformar a la estructura deseada
    const result = participants.map(p => {
      const userAnswers = answers.filter(a => a.userId === p.user.id);
      const formattedAnswers = userAnswers.map(ua => ({
        questionText: ua.question.text,
        answer: ua.answer,
        pointsEarned: ua.pointsEarned,
      }));

      return {
        userId: p.user.id,
        fullName: p.user.fullName || p.user.nickname || 'Usuario',
        avatarUrl: p.user.avatarUrl,
        answers: formattedAnswers,
        totalBonusPoints: formattedAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0),
      };
    });

    // Ordenar por totalBonusPoints desc
    return result.sort((a, b) => b.totalBonusPoints - a.totalBonusPoints);
  }
}
