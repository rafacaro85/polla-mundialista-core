import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLabelsToPrizes1766950000000 implements MigrationInterface {
  name = 'AddLabelsToPrizes1766950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "league_prizes" ADD "top_label" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_prizes" ADD "bottom_label" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "league_prizes" DROP COLUMN "bottom_label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "league_prizes" DROP COLUMN "top_label"`,
    );
  }
}
