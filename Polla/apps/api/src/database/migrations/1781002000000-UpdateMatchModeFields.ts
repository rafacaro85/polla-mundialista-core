import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMatchModeFields1781002000000 implements MigrationInterface {
  name = 'UpdateMatchModeFields1781002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN IF EXISTS "matchEventType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN IF EXISTS "match_event_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "showTableNumbers" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN IF EXISTS "showTableNumbers"`,
    );
  }
}
