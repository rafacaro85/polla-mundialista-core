import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTournamentIdToLeagues1740000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SAVEPOINT add_tournament_leagues`);
    try {
      // Add tournamentId column to leagues table
      await queryRunner.query(`
              ALTER TABLE leagues 
              ADD COLUMN IF NOT EXISTS "tournamentId" varchar DEFAULT 'WC2026'
          `);

      // Update existing leagues to have WC2026 as default
      await queryRunner.query(`
              UPDATE leagues 
              SET "tournamentId" = 'WC2026' 
              WHERE "tournamentId" IS NULL
          `);
    } catch (e) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT add_tournament_leagues`);
      console.log('Skipping AddTournamentIdToLeagues - table not ready');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE leagues 
            DROP COLUMN IF EXISTS "tournamentId"
        `);
  }
}
