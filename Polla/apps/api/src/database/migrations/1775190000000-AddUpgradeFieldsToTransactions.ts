import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpgradeFieldsToTransactions1775190000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_upgrade column
    const hasIsUpgrade = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'transactions' AND column_name = 'is_upgrade'
    `);
    if (hasIsUpgrade.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "transactions" ADD COLUMN "is_upgrade" boolean NOT NULL DEFAULT false`,
      );
    }

    // Add upgrade_plan column
    const hasUpgradePlan = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'transactions' AND column_name = 'upgrade_plan'
    `);
    if (hasUpgradePlan.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "transactions" ADD COLUMN "upgrade_plan" varchar NULL`,
      );
    }

    // Add current_plan column
    const hasCurrentPlan = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'transactions' AND column_name = 'current_plan'
    `);
    if (hasCurrentPlan.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "transactions" ADD COLUMN "current_plan" varchar NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "current_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "upgrade_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "is_upgrade"`,
    );
  }
}
