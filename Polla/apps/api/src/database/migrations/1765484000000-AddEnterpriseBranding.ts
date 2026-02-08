import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnterpriseBranding1765484000000 implements MigrationInterface {
  name = 'AddEnterpriseBranding1765484000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "brand_color_bg" character varying NOT NULL DEFAULT '#0F172A'`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "brand_color_text" character varying NOT NULL DEFAULT '#F8FAFC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "brand_cover_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN "brand_cover_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN "brand_color_text"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN "brand_color_bg"`,
    );
  }
}
