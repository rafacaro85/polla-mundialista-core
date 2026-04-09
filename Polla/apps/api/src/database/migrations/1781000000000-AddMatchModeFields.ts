import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatchModeFields1781000000000 implements MigrationInterface {
  name = 'AddMatchModeFields1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Match Mode columns to leagues
    await queryRunner.query(
      `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "match_code" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "active_match_id" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "is_match_mode" boolean NOT NULL DEFAULT false`,
    );

    // Add tableNumber to users
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "table_number" varchar`,
    );

    // Add createdAt to predictions for tie-breaker logic
    await queryRunner.query(
      `ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "predictions" DROP COLUMN IF EXISTS "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "table_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN IF EXISTS "is_match_mode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN IF EXISTS "active_match_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN IF EXISTS "match_code"`,
    );
  }
}
