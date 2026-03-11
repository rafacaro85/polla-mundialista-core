import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1741560000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_tournament_status 
      ON matches("tournamentId", status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_tournament_phase 
      ON matches("tournamentId", phase);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_date_status 
      ON matches(date, status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_tournament_league 
      ON predictions("tournamentId", "league_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_matches_tournament_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_matches_tournament_phase;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_matches_date_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_predictions_tournament_league;`);
  }
}
