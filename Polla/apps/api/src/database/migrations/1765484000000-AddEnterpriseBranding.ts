import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnterpriseBranding1765484000000 implements MigrationInterface {
  name = 'AddEnterpriseBranding1765484000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SAVEPOINT add_enterprise_branding`);
    try {
      await queryRunner.query(
        `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "brand_color_bg" character varying NOT NULL DEFAULT '#0F172A'`,
      );
      await queryRunner.query(
        `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "brand_color_text" character varying NOT NULL DEFAULT '#F8FAFC'`,
      );
      await queryRunner.query(
        `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "brand_cover_url" character varying`,
      );
    } catch (e) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT add_enterprise_branding`);
      console.log('Skipping AddEnterpriseBranding - table not ready');
    }
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
