import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnalyticsTables1776500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ranking_snapshots (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "leagueId" VARCHAR NOT NULL,
        "userId" VARCHAR NOT NULL,
        matchday INTEGER NOT NULL,
        position INTEGER NOT NULL,
        "totalPoints" INTEGER DEFAULT 0,
        "regularPoints" INTEGER DEFAULT 0,
        "jokerPoints" INTEGER DEFAULT 0,
        "bonusPoints" INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "userId" VARCHAR NOT NULL,
        "leagueId" VARCHAR NOT NULL,
        "sessionStart" TIMESTAMP NOT NULL,
        "sessionEnd" TIMESTAMP,
        "durationMinutes" INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS analytics_cache (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "leagueId" VARCHAR NOT NULL,
        "reportType" VARCHAR NOT NULL,
        data JSONB NOT NULL,
        computed_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS analytics_cache');
    await queryRunner.query('DROP TABLE IF EXISTS user_sessions');
    await queryRunner.query('DROP TABLE IF EXISTS ranking_snapshots');
  }
}
