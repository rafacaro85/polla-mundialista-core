import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { DataSource } from 'typeorm';

@Controller('debug')
export class DebugController {
  // Last updated: 2026-02-22T21:28:00Z - Forced deploy for leage detail fix
  @Get('version')
  getVersion() {
    return {
      version: '2.0.debug-leagues-fix',
      timestamp: '2026-02-22T21:28:00Z',
    };
  }

  constructor(
    @InjectRepository(BonusQuestion)
    private bonusQuestionRepository: Repository<BonusQuestion>,
    @InjectRepository(UserBonusAnswer)
    private userBonusAnswerRepository: Repository<UserBonusAnswer>,
    private dataSource: DataSource,
  ) {}

  @Get('ping')
  getPing() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'DebugController is live',
    };
  }

  @Get('db-schema')
  async debugDbSchema() {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const table = await queryRunner.getTable('leagues');
      const columns = table?.columns.map((c) => ({
        name: c.name,
        type: c.type,
      }));

      const config = this.dataSource.options as any;
      const maskedUrl = config.url
        ? config.url.replace(/:[^:@]+@/, ':***@')
        : 'N/A';

      const tablesRaw = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tables = tablesRaw.map((t: any) => t.table_name);

      const counts: Record<string, number> = {};
      if (tables.includes('leagues')) {
        const leagueCount = await queryRunner.query(
          'SELECT COUNT(*) FROM leagues',
        );
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
        ? await queryRunner.query('SELECT * FROM leagues WHERE id = $1', [
            '4b5f5caf-4f5c-49e6-9600-409f29081a46',
          ])
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
        brandColorHeadingExists: columns?.some(
          (c) => c.name === 'brand_color_heading',
        ),
        columns: columns,
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
    const results: string[] = [];
    try {
      console.log('--- [DB-REPAIR] Ejecutando reparación completa de esquema ---');

      // ====== 1. ENUM VALUES FALTANTES ======
      // IMPORTANTE: ALTER TYPE ADD VALUE NO funciona dentro de transacciones en PostgreSQL
      // Por eso usamos this.dataSource.query() directamente (fuera de transacción)
      
      // PENDING_PAYMENT en league_participants
      try {
        await this.dataSource.query(`ALTER TYPE league_participant_status_enum ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT'`);
        results.push('✅ ENUM: PENDING_PAYMENT en league_participant_status_enum');
      } catch (e) { results.push(`⚠️ ENUM league_participant: ${e.message}`); }

      // PENDING_PAYMENT en transactions
      try {
        await this.dataSource.query(`ALTER TYPE transaction_status_enum ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT'`);
        results.push('✅ ENUM: PENDING_PAYMENT en transaction_status_enum');
      } catch (e) { results.push(`⚠️ ENUM transaction: ${e.message}`); }

      // PENDING en leagues_status_enum
      try {
        await this.dataSource.query(`ALTER TYPE "public"."leagues_status_enum" ADD VALUE IF NOT EXISTS 'PENDING'`);
        results.push('✅ ENUM: PENDING en leagues_status_enum');
      } catch (e) {
        try {
          await this.dataSource.query(`ALTER TYPE "leagues_status_enum" ADD VALUE IF NOT EXISTS 'PENDING'`);
          results.push('✅ ENUM: PENDING en leagues_status_enum (fallback)');
        } catch (e2) { results.push(`⚠️ ENUM PENDING league: ${e2.message}`); }
      }

      // REJECTED en leagues_status_enum
      try {
        await this.dataSource.query(`ALTER TYPE "public"."leagues_status_enum" ADD VALUE IF NOT EXISTS 'REJECTED'`);
        results.push('✅ ENUM: REJECTED en leagues_status_enum');
      } catch (e) { results.push(`⚠️ ENUM REJECTED: ${e.message}`); }

      // ====== 2. COLUMNAS FALTANTES EN LEAGUES ======
      const leagueColumns = [
        ["brand_color_heading", "VARCHAR(255) DEFAULT '#FFFFFF'"],
        ["brand_color_bars", "VARCHAR(255) DEFAULT '#00E676'"],
        ["match_code", "VARCHAR(255)"],
        ["active_match_id", "VARCHAR(255)"],
        ["is_match_mode", "BOOLEAN DEFAULT false"],
        ["brand_cover_url", "VARCHAR(255)"],
        ["brand_font_family", "VARCHAR(255) DEFAULT '\"Russo One\", sans-serif'"],
        ["enable_department_war", "BOOLEAN DEFAULT false"],
        ["brand_color_primary", "VARCHAR(255) DEFAULT '#00E676'"],
        ["brand_color_secondary", "VARCHAR(255) DEFAULT '#1E293B'"],
        ["brand_color_bg", "VARCHAR(255) DEFAULT '#0F172A'"],
        ["brand_color_text", "VARCHAR(255) DEFAULT '#F8FAFC'"],
        ["show_ads", "BOOLEAN DEFAULT false"],
        ["ad_images", "TEXT"],
        ["created_at", "TIMESTAMP DEFAULT now()"],
        ["deleted_at", "TIMESTAMP"],
      ];

      for (const [col, type] of leagueColumns) {
        try {
          await queryRunner.query(`ALTER TABLE leagues ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
          results.push(`✅ COLUMN leagues.${col}`);
        } catch (e) { results.push(`⚠️ COLUMN leagues.${col}: ${e.message}`); }
      }

      // ====== 3. COLUMNAS FALTANTES EN USERS ======
      const userColumns = [
        ["table_number", "VARCHAR(255)"],
        ["welcome_email_sent", "BOOLEAN DEFAULT false"],
      ];

      for (const [col, type] of userColumns) {
        try {
          await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
          results.push(`✅ COLUMN users.${col}`);
        } catch (e) { results.push(`⚠️ COLUMN users.${col}: ${e.message}`); }
      }

      // ====== 4. COLUMNAS FALTANTES EN PREDICTIONS ======
      try {
        await queryRunner.query(`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        results.push('✅ COLUMN predictions.created_at');
      } catch (e) { results.push(`⚠️ COLUMN predictions.created_at: ${e.message}`); }

      // ====== 5. TABLAS FALTANTES (PRIZES / BANNERS) ======
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS league_prizes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          league_id UUID NOT NULL,
          type VARCHAR(50) DEFAULT 'image',
          badge VARCHAR(255),
          name VARCHAR(255),
          image_url TEXT,
          amount DECIMAL(15,2),
          top_label VARCHAR(255),
          bottom_label VARCHAR(255),
          "order" INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now(),
          CONSTRAINT fk_league_prize FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
        )
      `);
      results.push('✅ TABLE league_prizes');

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS league_banners (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          league_id UUID NOT NULL,
          image_url TEXT NOT NULL,
          title VARCHAR(255),
          description TEXT,
          tag VARCHAR(100),
          button_text VARCHAR(100),
          button_url TEXT,
          "order" INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now(),
          CONSTRAINT fk_league_banner FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
        )
      `);
      results.push('✅ TABLE league_banners');

      // ====== 6. COLUMNAS EXTRA EN TABLAS EXISTENTES ======
      const prizeExtras = ["type VARCHAR(50) DEFAULT 'image'", "badge VARCHAR(255)", "amount DECIMAL(15,2)", "top_label VARCHAR(255)", "bottom_label VARCHAR(255)", '"order" INT DEFAULT 0'];
      for (const def of prizeExtras) {
        try { await queryRunner.query(`ALTER TABLE league_prizes ADD COLUMN IF NOT EXISTS ${def}`); } catch (e) { /* ya existe */ }
      }
      const bannerExtras = ["title VARCHAR(255)", "description TEXT", "tag VARCHAR(100)", "button_text VARCHAR(100)", "button_url TEXT", '"order" INT DEFAULT 0'];
      for (const def of bannerExtras) {
        try { await queryRunner.query(`ALTER TABLE league_banners ADD COLUMN IF NOT EXISTS ${def}`); } catch (e) { /* ya existe */ }
      }
      results.push('✅ EXTRA COLUMNS en prizes y banners');

      return {
        success: true,
        message: 'Reparación completa ejecutada.',
        details: results,
      };
    } catch (e) {
      return {
        success: false,
        error: e.message,
        partialResults: results,
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
