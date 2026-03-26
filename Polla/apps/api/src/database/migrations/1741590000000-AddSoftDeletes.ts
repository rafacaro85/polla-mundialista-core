import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeletes1741590000000 implements MigrationInterface {
  name = 'AddSoftDeletes1741590000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE leagues ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE predictions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE predictions DROP COLUMN IF EXISTS deleted_at;`);
    await queryRunner.query(`ALTER TABLE leagues DROP COLUMN IF EXISTS deleted_at;`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;`);
  }
}
