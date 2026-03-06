import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentWarToLeague1766900000000 implements MigrationInterface {
  name = 'AddDepartmentWarToLeague1766900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SAVEPOINT add_department_war`);
    try {
      await queryRunner.query(
        `ALTER TABLE "leagues" ADD "enable_department_war" boolean NOT NULL DEFAULT false`,
      );
    } catch (e) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT add_department_war`);
      console.log('Skipping AddDepartmentWarToLeague - table not ready');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN "enable_department_war"`,
    );
  }
}
