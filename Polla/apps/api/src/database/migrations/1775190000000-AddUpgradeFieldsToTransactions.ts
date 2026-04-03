import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpgradeFieldsToTransactions1775190000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
<<<<<<< HEAD
    // Add is_upgrade column
    const hasIsUpgrade = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'transactions' AND column_name = 'is_upgrade'
    `);
    if (hasIsUpgrade.length === 0) {
=======
    const table = await queryRunner.getTable('transactions');
    if (!table) return;

    if (!table.findColumnByName('is_upgrade')) {
>>>>>>> develop
      await queryRunner.query(
        `ALTER TABLE "transactions" ADD COLUMN "is_upgrade" boolean NOT NULL DEFAULT false`,
      );
    }
<<<<<<< HEAD

    // Add upgrade_plan column
    const hasUpgradePlan = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'transactions' AND column_name = 'upgrade_plan'
    `);
    if (hasUpgradePlan.length === 0) {
=======
    if (!table.findColumnByName('upgrade_plan')) {
>>>>>>> develop
      await queryRunner.query(
        `ALTER TABLE "transactions" ADD COLUMN "upgrade_plan" varchar NULL`,
      );
    }
<<<<<<< HEAD

    // Add current_plan column
    const hasCurrentPlan = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'transactions' AND column_name = 'current_plan'
    `);
    if (hasCurrentPlan.length === 0) {
=======
    if (!table.findColumnByName('current_plan')) {
>>>>>>> develop
      await queryRunner.query(
        `ALTER TABLE "transactions" ADD COLUMN "current_plan" varchar NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
<<<<<<< HEAD
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "current_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "upgrade_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "is_upgrade"`,
    );
=======
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "current_plan"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "upgrade_plan"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "is_upgrade"`);
>>>>>>> develop
  }
}
