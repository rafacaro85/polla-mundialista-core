import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnterpriseActiveManual1765427245958 implements MigrationInterface {
  name = 'AddEnterpriseActiveManual1765427245958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SAVEPOINT add_enterprise_active`);
    try {
      await queryRunner.query(
        `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "is_enterprise_active" boolean NOT NULL DEFAULT false`,
      );
    } catch (e) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT add_enterprise_active`);
      console.log('Skipping AddEnterpriseActiveManual - table not ready');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN "is_enterprise_active"`,
    );
  }
}
