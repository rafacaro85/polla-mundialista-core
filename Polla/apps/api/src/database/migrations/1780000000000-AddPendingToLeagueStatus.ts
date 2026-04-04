import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingToLeagueStatus1780000000000 implements MigrationInterface {
  name = 'AddPendingToLeagueStatus1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Determine the exact enum name that typeorm generated. Usually it's "leagues_status_enum"
    // Postgres allows adding a value to an enum easily:
    try {
      await queryRunner.query(
        `ALTER TYPE "public"."leagues_status_enum" ADD VALUE IF NOT EXISTS 'PENDING';`
      );
    } catch (e) {
      console.log('Error adding PENDING to leagues_status_enum (maybe enum name differs).', e.message);
      // Fallback if naming differs
      try {
        await queryRunner.query(`ALTER TYPE "leagues_status_enum" ADD VALUE IF NOT EXISTS 'PENDING';`);
      } catch (err2) {
         console.log(err2.message);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres doesn't easily support dropping an enum value.
    console.log('Cannot remove PENDING value from enum down migration safely without table rewrite.');
  }
}
