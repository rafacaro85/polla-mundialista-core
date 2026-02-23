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
      
      const tablesRaw = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tables = tablesRaw.map((t: any) => t.table_name);

      const counts: Record<string, number> = {};
      if (tables.includes('leagues')) {
        const leagueCount = await queryRunner.query('SELECT COUNT(*) FROM leagues');
        counts['leagues'] = Number(leagueCount[0].count);
      }
      if (tables.includes('users')) {
        const userCount = await queryRunner.query('SELECT COUNT(*) FROM users');
        counts['users'] = Number(userCount[0].count);
      }

      const sampleLeagues = tables.includes('leagues') 
        ? await queryRunner.query('SELECT id, name FROM leagues LIMIT 5')
        : [];
      
      const sampleUsers = tables.includes('users')
        ? await queryRunner.query('SELECT id, email FROM users LIMIT 5')
        : [];

      const specificLeague = tables.includes('leagues')
        ? await queryRunner.query('SELECT * FROM leagues WHERE id = $1', ['4b5f5caf-4f5c-49e6-9800-409f29081a46'])
        : [];

      return {
        database: config.database || 'N/A',
        host: config.host || 'N/A',
        url: maskedUrl,
        tableName: table?.name,
        counts: counts,
        sampleLeagues,
        sampleUsers,
        specificLeague: specificLeague[0] || 'NOT_FOUND',
        brandColorHeadingExists: columns?.some(c => c.name === 'brand_color_heading'),
        columns: columns
      };
    } catch (e) {
      return { error: e.message };
    } finally {
      await queryRunner.release();
    }
  }

  @Get('db-repair')
  async repairDb() {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      console.log('--- Intentando reparación de emergencia desde el API ---');
      await queryRunner.query('ALTER TABLE leagues ADD COLUMN IF NOT EXISTS brand_color_heading VARCHAR(255) DEFAULT \'#FFFFFF\'');
      await queryRunner.query('ALTER TABLE leagues ADD COLUMN IF NOT EXISTS brand_color_bars VARCHAR(255) DEFAULT \'#00E676\'');
      
      return { 
        success: true, 
        message: 'Columnas creadas/verificadas con éxito desde el proceso del API.' 
      };
    } catch (e) {
      return { 
        success: false, 
        error: e.message,
        hint: 'Es posible que el usuario de la DB no tenga permisos de ALTER TABLE, pero usualmente en Railway el usuario postgres tiene todo.'
      };
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
