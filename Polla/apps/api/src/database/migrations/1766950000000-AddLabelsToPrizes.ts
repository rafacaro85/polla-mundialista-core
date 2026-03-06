import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLabelsToPrizes1766950000000 implements MigrationInterface {
  name = 'AddLabelsToPrizes1766950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SAVEPOINT add_labels_to_prizes`);
    try {
      await queryRunner.query(
        `ALTER TABLE "league_prizes" ADD "top_label" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "league_prizes" ADD "bottom_label" character varying`,
      );
    } catch (e) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT add_labels_to_prizes`);
      console.log('Skipping AddLabelsToPrizes - table not ready');
    }
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
