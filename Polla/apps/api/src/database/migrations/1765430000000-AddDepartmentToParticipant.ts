import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentToParticipant1765430000000 implements MigrationInterface {
  name = 'AddDepartmentToParticipant1765430000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SAVEPOINT add_department_participant`);
    try {
      await queryRunner.query(
        `ALTER TABLE "league_participants" ADD COLUMN IF NOT EXISTS "department" character varying`,
      );
    } catch (e) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT add_department_participant`);
      console.log('Skipping AddDepartmentToParticipant - table not ready');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "league_participants" DROP COLUMN "department"`,
    );
  }
}
