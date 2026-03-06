import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrandFontFamily1765500000000 implements MigrationInterface {
  name = 'AddBrandFontFamily1765500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SAVEPOINT add_brand_font_family`);
    try {
      await queryRunner.query(
        `ALTER TABLE "leagues" ADD COLUMN IF NOT EXISTS "brand_font_family" character varying NOT NULL DEFAULT '"Russo One", sans-serif'`,
      );
    } catch (e) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT add_brand_font_family`);
      console.log('Skipping AddBrandFontFamily - table not ready');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leagues" DROP COLUMN "brand_font_family"`,
    );
  }
}
