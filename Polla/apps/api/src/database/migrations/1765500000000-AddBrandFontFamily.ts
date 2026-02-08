import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrandFontFamily1765500000000 implements MigrationInterface {
  name = 'AddBrandFontFamily1765500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "brand_font_family" character varying NOT NULL DEFAULT '"Russo One", sans-serif'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN "brand_font_family"`,
    );
  }
}
