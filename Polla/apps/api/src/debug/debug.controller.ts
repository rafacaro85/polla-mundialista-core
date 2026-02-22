import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { DataSource } from 'typeorm';

@Controller('debug')
export class DebugController {
  constructor(
    @InjectRepository(BonusQuestion)
    private bonusQuestionRepository: Repository<BonusQuestion>,
    @InjectRepository(UserBonusAnswer)
    private userBonusAnswerRepository: Repository<UserBonusAnswer>,
    private dataSource: DataSource,
  ) {}

  @Get('ping')
  getPing() {
    return { status: 'ok', timestamp: new Date().toISOString(), message: 'DebugController is live' };
  }

  @Get('db-schema')
  async debugDbSchema() {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const table = await queryRunner.getTable('leagues');
      const columns = table?.columns.map(c => ({ name: c.name, type: c.type }));
      
      const config = this.dataSource.options as any;
      const maskedUrl = config.url ? config.url.replace(/:[^:@]+@/, ':***@') : 'N/A';
      
      return {
        database: config.database || 'N/A',
        host: config.host || 'N/A',
        url: maskedUrl,
        tableName: table?.name,
        columnsCount: columns?.length,
        brandColorHeadingExists: columns?.some(c => c.name === 'brand_color_heading'),
        columns: columns
      };
    } catch (e) {
      return { error: e.message };
    } finally {
      await queryRunner.release();
    }
  }

  @Get('bonus-data')
  async getBonusData() {
    const questions = await this.bonusQuestionRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const answers = await this.userBonusAnswerRepository.find({
      relations: ['user', 'question'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        points: q.points,
        correctAnswer: q.correctAnswer,
        isActive: q.isActive,
        leagueId: q.leagueId,
        createdAt: q.createdAt,
      })),
      answers: answers.map((a) => ({
        id: a.id,
        answer: a.answer,
        pointsEarned: a.pointsEarned,
        userId: a.userId,
        questionId: a.questionId,
        questionText: a.question?.text,
        questionLeagueId: a.question?.leagueId,
        userName: a.user?.fullName,
        createdAt: a.createdAt,
      })),
    };
  }

  @Get('reset-bonus-points')
  async resetBonusPoints() {
    // Reset all bonus answer points to 0
    const result = await this.userBonusAnswerRepository
      .createQueryBuilder()
      .update()
      .set({ pointsEarned: 0 })
      .execute();

    return {
      message: 'All bonus points reset to 0',
      affectedRows: result.affected,
    };
  }
}
