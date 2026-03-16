import { MigrationInterface, QueryRunner } from "typeorm";

export class RecalculateBracketPoints1773691659402 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Reset points
        await queryRunner.query('UPDATE user_brackets SET points = 0');

        // 2. Get finished matches (non-group phases)
        const matches = await queryRunner.query(`
            SELECT id, "homeScore", "awayScore", "homeTeam", "awayTeam", "tournamentId"
            FROM matches
            WHERE status = 'FINISHED' AND phase NOT LIKE 'GROUP%'
        `);

        for (const match of matches) {
            // Determine winner (must be one in bracket rounds)
            const winner = match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
            
            // 3. Update brackets that guessed the winner
            // picks->>matchId = winner
            await queryRunner.query(`
                UPDATE user_brackets
                SET points = points + 2
                WHERE "tournamentId" = $1 AND picks->>$2 = $3
            `, [match.tournamentId, match.id, winner]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No simple down possible without re-implementing old PHASE_POINTS logic here
    }

}
