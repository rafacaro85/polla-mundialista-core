import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatchGuestToRole1781001000000 implements MigrationInterface {
  name = 'AddMatchGuestToRole1781001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add MATCH_GUEST to users_role_enum if it doesn't already exist
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'MATCH_GUEST'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres doesn't easily support dropping an enum value.
    // In most cases, it's safer to leave it or rename the enum and recreate.
    // For this simple rollback, we won't try to drop the value.
  }
}
