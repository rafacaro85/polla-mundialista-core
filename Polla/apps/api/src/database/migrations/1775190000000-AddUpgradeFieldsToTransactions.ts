import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpgradeFieldsToTransactions1775190000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('transactions');
    if (!table) return;

    if (!table.findColumnByName('is_upgrade')) {
      await queryRunner.query(
        `ALTER TABLE "transactions" ADD COLUMN "is_upgrade" boolean NOT NULL DEFAULT false`,
      );
    }
    if (!table.findColumnByName('upgrade_plan')) {
      await queryRunner.query(
        `ALTER TABLE "transactions" ADD COLUMN "upgrade_plan" varchar NULL`,
      );
    }
    if (!table.findColumnByName('current_plan')) {
      await queryRunner.query(
        `ALTER TABLE "transactions" ADD COLUMN "current_plan" varchar NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "current_plan"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "upgrade_plan"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "is_upgrade"`);
  }
}
