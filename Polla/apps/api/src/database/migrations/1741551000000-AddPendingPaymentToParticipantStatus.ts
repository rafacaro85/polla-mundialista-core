import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingPaymentToParticipantStatus1741551000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE league_participant_status_enum ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL no permite eliminar valores de un enum
  }
}
