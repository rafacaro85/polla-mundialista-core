import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingPaymentToParticipantStatus1741551000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'league_participant_status_enum') THEN
          ALTER TYPE league_participant_status_enum ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL no permite eliminar valores de un enum
  }
}
