import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDepartmentWarToLeague1766900000000 implements MigrationInterface {
    name = 'AddDepartmentWarToLeague1766900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leagues" ADD "enable_department_war" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN "enable_department_war"`);
    }
}
