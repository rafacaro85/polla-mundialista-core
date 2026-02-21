import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrizeTypeToLeagues1740000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE leagues
      ADD COLUMN IF NOT EXISTS prize_type varchar DEFAULT 'image'
    `);

    await queryRunner.query(`
      ALTER TABLE leagues
      ADD COLUMN IF NOT EXISTS prize_amount decimal(15,2) DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE leagues
      DROP COLUMN IF EXISTS prize_type
    `);

    await queryRunner.query(`
      ALTER TABLE leagues
      DROP COLUMN IF EXISTS prize_amount
    `);
  }
}
