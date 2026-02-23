import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeagueParticipantStatus1770960863134 implements MigrationInterface {
  name = 'AddLeagueParticipantStatus1770960863134';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."league_participants_status_enum" AS ENUM('PENDING', 'ACTIVE', 'REJECTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_participants" ADD "status" "public"."league_participants_status_enum" NOT NULL DEFAULT 'ACTIVE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "league_participants" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."league_participants_status_enum"`,
    );
  }
}
