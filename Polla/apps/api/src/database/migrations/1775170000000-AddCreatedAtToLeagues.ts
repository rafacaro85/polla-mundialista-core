import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtToLeagues1775170000000 implements MigrationInterface {
    name = 'AddCreatedAtToLeagues1775170000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leagues" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN "created_at"`);
    }

}
