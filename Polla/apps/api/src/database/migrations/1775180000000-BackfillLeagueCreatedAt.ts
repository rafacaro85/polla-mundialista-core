import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillLeagueCreatedAt1775180000000 implements MigrationInterface {
    name = 'BackfillLeagueCreatedAt1775180000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Backfill created_at from the earliest participant joined_at
        // The first participant is typically the creator, so their join date ≈ league creation date
        const result1 = await queryRunner.query(`
            UPDATE leagues l
            SET created_at = sub.earliest
            FROM (
                SELECT league_id, MIN(joined_at) AS earliest
                FROM league_participants
                WHERE joined_at IS NOT NULL
                GROUP BY league_id
            ) sub
            WHERE l.id = sub.league_id
              AND sub.earliest IS NOT NULL
              AND sub.earliest < l.created_at
        `);
        console.log('[Migration] Backfilled leagues from participants:', result1);

        // Fallback: For leagues without participants, use earliest transaction
        const result2 = await queryRunner.query(`
            UPDATE leagues l
            SET created_at = sub.earliest
            FROM (
                SELECT league_id, MIN(created_at) AS earliest
                FROM transactions
                WHERE created_at IS NOT NULL
                GROUP BY league_id
            ) sub
            WHERE l.id = sub.league_id
              AND sub.earliest IS NOT NULL
              AND sub.earliest < l.created_at
        `);
        console.log('[Migration] Backfilled leagues from transactions:', result2);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Cannot undo backfill - the original data didn't exist
    }
}
