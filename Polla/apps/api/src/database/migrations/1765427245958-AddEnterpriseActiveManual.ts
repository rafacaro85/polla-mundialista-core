import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEnterpriseActiveManual1765427245958 implements MigrationInterface {
    name = 'AddEnterpriseActiveManual1765427245958'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "is_enterprise_active" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN "is_enterprise_active"`);
    }

}
