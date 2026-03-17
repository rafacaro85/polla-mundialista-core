import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationCodeExpiry1741580000000 implements MigrationInterface {
  name = 'AddVerificationCodeExpiry1741580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "verificationCodeExpiresAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "verificationCodeExpiresAt"`,
    );
  }
}
