import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJokerConfig1741570000000 implements MigrationInterface {
  name = 'CreateJokerConfig1741570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "joker_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tournamentId" character varying NOT NULL,
        "phase" character varying,
        "group" character varying,
        "maxJokers" integer NOT NULL,
        CONSTRAINT "PK_joker_config_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO joker_config (id, "tournamentId", phase, "group", "maxJokers")
      VALUES
        -- WC2026: fase grupos = 3 comodines
        (gen_random_uuid(), 'WC2026', 'GROUP', null, 3),
        -- WC2026: fases eliminatorias = 1 comodín
        (gen_random_uuid(), 'WC2026', 'ROUND_32', null, 1),
        (gen_random_uuid(), 'WC2026', 'ROUND_16', null, 1),
        (gen_random_uuid(), 'WC2026', 'QUARTER', null, 1),
        (gen_random_uuid(), 'WC2026', 'SEMI', null, 1),
        (gen_random_uuid(), 'WC2026', 'FINAL', null, 1),
        (gen_random_uuid(), 'WC2026', '3RD_PLACE', null, 1),
        -- UCL2526: 1 comodín por LEG
        (gen_random_uuid(), 'UCL2526', null, 'LEG_1', 1),
        (gen_random_uuid(), 'UCL2526', null, 'LEG_2', 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "joker_config"`);
  }
}
