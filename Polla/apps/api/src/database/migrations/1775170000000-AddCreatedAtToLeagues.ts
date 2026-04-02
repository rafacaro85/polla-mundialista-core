import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtToLeagues1775170000000 implements MigrationInterface {
    name = 'AddCreatedAtToLeagues1775170000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Safe check: only add column if it doesn't already exist
        const hasColumn = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'leagues' AND column_name = 'created_at'
        `);
        if (hasColumn.length === 0) {
            await queryRunner.query(`ALTER TABLE "leagues" ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN IF EXISTS "created_at"`);
    }
}
