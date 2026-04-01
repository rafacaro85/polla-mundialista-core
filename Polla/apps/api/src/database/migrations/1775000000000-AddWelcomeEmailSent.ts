import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWelcomeEmailSent1775000000000 implements MigrationInterface {
  name = 'AddWelcomeEmailSent1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "welcome_email_sent" BOOLEAN NOT NULL DEFAULT FALSE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "welcome_email_sent"
    `);
  }
}
