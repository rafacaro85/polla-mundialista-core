import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrizeTypeToLeagues1740000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SAVEPOINT add_prize_type`);
    try {
      await queryRunner.query(`
        ALTER TABLE leagues
        ADD COLUMN IF NOT EXISTS prize_type varchar DEFAULT 'image'
      `);

      await queryRunner.query(`
        ALTER TABLE leagues
        ADD COLUMN IF NOT EXISTS prize_amount decimal(15,2) DEFAULT NULL
      `);
    } catch (e) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT add_prize_type`);
      console.log('Skipping AddPrizeTypeToLeagues - table not ready');
    }
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
