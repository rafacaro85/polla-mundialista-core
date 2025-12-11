import { MigrationInterface, QueryRunner } from "typeorm";

export class ExpandSchemaForAdvancedFeatures1764649438287 implements MigrationInterface {
    name = 'ExpandSchemaForAdvancedFeatures1764649438287'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Migration disabled to prevent conflicts with existing DB
        /*
        await queryRunner.query(`CREATE TABLE "system_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" text NOT NULL, CONSTRAINT "UQ_eedd3cd0f227c7fb5eff2204e93" UNIQUE ("key"), CONSTRAINT "PK_db4e70ac0d27e588176e9bb44a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('PENDING', 'PAID', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'PENDING', "reference_code" character varying NOT NULL, "package_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "UQ_e29011bc90d42a7b0524d3c88c8" UNIQUE ("reference_code"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "league_participants" ADD "trivia_points" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD "branding_logo_url" character varying`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD "prize_details" text`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD "prize_image_url" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."leagues_status_enum" RENAME TO "leagues_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."leagues_status_enum" AS ENUM('ACTIVE', 'LOCKED', 'FINISHED', 'ARCHIVED')`);
        await queryRunner.query(`ALTER TABLE "leagues" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "leagues" ALTER COLUMN "status" TYPE "public"."leagues_status_enum" USING "status"::"text"::"public"."leagues_status_enum"`);
        await queryRunner.query(`ALTER TABLE "leagues" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."leagues_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        */
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`);
        await queryRunner.query(`CREATE TYPE "public"."leagues_status_enum_old" AS ENUM('ACTIVE', 'LOCKED', 'FINISHED')`);
        await queryRunner.query(`ALTER TABLE "leagues" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "leagues" ALTER COLUMN "status" TYPE "public"."leagues_status_enum_old" USING "status"::"text"::"public"."leagues_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "leagues" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."leagues_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."leagues_status_enum_old" RENAME TO "leagues_status_enum"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN "prize_image_url"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN "prize_details"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN "branding_logo_url"`);
        await queryRunner.query(`ALTER TABLE "league_participants" DROP COLUMN "trivia_points"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TABLE "system_config"`);
    }

}
