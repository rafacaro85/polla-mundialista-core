import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateKnockoutPhaseStatus1734912000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'knockout_phase_status',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'phase',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'is_unlocked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'unlocked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'all_matches_completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Insert initial phase statuses
    await queryRunner.query(`
            INSERT INTO knockout_phase_status (phase, is_unlocked, unlocked_at)
            VALUES 
                ('GROUP', true, CURRENT_TIMESTAMP),
                ('ROUND_32', false, NULL),
                ('ROUND_16', false, NULL),
                ('QUARTER', false, NULL),
                ('SEMI', false, NULL),
                ('FINAL', false, NULL)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('knockout_phase_status');
  }
}
