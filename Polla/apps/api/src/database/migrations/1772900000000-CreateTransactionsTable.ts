import { MigrationInterface, QueryRunner } from 'typeorm';
import { Logger } from '@nestjs/common';

export class CreateTransactionsTable1772900000000 implements MigrationInterface {
  private readonly logger = new Logger('Migration - CreateTransactionsTable');

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SAVEPOINT create_transactions`);
    try {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "transactions" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "referenceCode" character varying NOT NULL,
          "amount" numeric NOT NULL,
          "currency" character varying NOT NULL DEFAULT 'COP',
          "status" character varying NOT NULL DEFAULT 'PENDING',
          "packageId" character varying,
          "notes" text,
          "paymentMethod" character varying,
          "externalId" character varying,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "userId" uuid,
          "leagueId" uuid,
          CONSTRAINT "PK_transactions" PRIMARY KEY ("id")
        )
      `);
      this.logger.log('✅ transactions table created');
    } catch(e) {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT create_transactions`);
      this.logger.log('Skipping - transactions table already exists');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
  }
}
