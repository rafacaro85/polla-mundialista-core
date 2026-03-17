import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1772823252273 implements MigrationInterface {
    name = 'InitialSchema1772823252273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'system_settings'
            );
        `);
        
        if (tableExists[0]?.exists) {
            console.log("Skipping InitialSchema since database already exists.");
            return;
        }

        await queryRunner.query(`CREATE TABLE "system_settings" ("id" SERIAL NOT NULL, "instagram" character varying NOT NULL DEFAULT 'https://instagram.com/tupolla', "facebook" character varying NOT NULL DEFAULT 'https://facebook.com/tupolla', "whatsapp" character varying NOT NULL DEFAULT 'https://wa.me/123456', "tiktok" character varying NOT NULL DEFAULT 'https://tiktok.com/@tupolla', "support" character varying NOT NULL DEFAULT 'mailto:soporte@tupolla.com', "termsUrl" character varying NOT NULL DEFAULT '/terminos', "privacyUrl" character varying NOT NULL DEFAULT '/privacidad', "copyright" character varying NOT NULL DEFAULT 'Copyright © 2026 TuApp. Todos los derechos reservados.', CONSTRAINT "PK_82521f08790d248b2a80cc85d40" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournamentId" character varying NOT NULL DEFAULT 'WC2026', "homeTeam" character varying NOT NULL, "awayTeam" character varying NOT NULL, "homeScore" integer, "awayScore" integer, "date" TIMESTAMP NOT NULL DEFAULT now(), "homeFlag" character varying, "awayFlag" character varying, "phase" character varying, "group" character varying, "homeTeamPlaceholder" character varying, "awayTeamPlaceholder" character varying, "bracketId" integer, "nextMatchId" character varying, "status" character varying NOT NULL DEFAULT 'PENDING', "externalId" integer, "minute" character varying, "isManuallyLocked" boolean NOT NULL DEFAULT false, "isTimerActive" boolean NOT NULL DEFAULT false, "stadium" character varying, "ai_prediction" text, "ai_prediction_score" character varying(10), "ai_prediction_generated_at" TIMESTAMP, CONSTRAINT "PK_8a22c7b2e0828988d51256117f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "predictions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournamentId" character varying NOT NULL DEFAULT 'WC2026', "league_id" character varying, "homeScore" integer NOT NULL, "awayScore" integer NOT NULL, "points" integer NOT NULL DEFAULT '0', "isJoker" boolean NOT NULL DEFAULT false, "userId" uuid, "matchId" uuid, CONSTRAINT "PK_b92c9e4db595214b289f5e28adc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8dbffbd0f32db4e14484eba1de" ON "predictions" ("userId", "matchId", "league_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8ea301bcc3c985841fe18f6ab5" ON "predictions" ("userId", "league_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3458aa50ebcc2f3df1d720161a" ON "predictions" ("matchId") `);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "logo_url" character varying, "primary_color" character varying, "owner_id" uuid, CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."league_participants_status_enum" AS ENUM('PENDING', 'ACTIVE', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "league_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "total_points" integer NOT NULL DEFAULT '0', "current_rank" integer, "isAdmin" boolean NOT NULL DEFAULT false, "is_blocked" boolean NOT NULL DEFAULT false, "trivia_points" integer NOT NULL DEFAULT '0', "prediction_points" integer NOT NULL DEFAULT '0', "bracket_points" integer NOT NULL DEFAULT '0', "joker_points" integer NOT NULL DEFAULT '0', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), "tie_breaker_guess" integer, "department" character varying, "status" "public"."league_participants_status_enum" NOT NULL DEFAULT 'ACTIVE', "is_paid" boolean NOT NULL DEFAULT false, "league_id" uuid, "user_id" uuid, CONSTRAINT "UQ_56fd2679785444c5bd6972eb4cb" UNIQUE ("league_id", "user_id"), CONSTRAINT "PK_6c7ad5e616a5021c9917f7e4a53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_564e0b5f83f3b1b6eabb0d1bf3" ON "league_participants" ("league_id", "total_points") `);
        await queryRunner.query(`CREATE TABLE "league_prizes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "badge" character varying, "name" character varying, "image_url" text, "amount" numeric(15,2), "top_label" character varying, "bottom_label" character varying, "order" integer NOT NULL DEFAULT '0', "league_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b732bdeb5d03c86a24bd474b6d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "league_banners" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "image_url" text NOT NULL, "title" character varying, "description" text, "tag" character varying, "button_text" character varying, "button_url" text, "order" integer NOT NULL DEFAULT '0', "league_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a32046439ee6497a3271e946c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."leagues_type_enum" AS ENUM('GLOBAL', 'VIP', 'LIBRE', 'COMPANY')`);
        await queryRunner.query(`CREATE TYPE "public"."leagues_status_enum" AS ENUM('ACTIVE', 'LOCKED', 'FINISHED', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TABLE "leagues" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournamentId" character varying NOT NULL DEFAULT 'WC2026', "name" character varying NOT NULL, "type" "public"."leagues_type_enum" NOT NULL, "access_code_prefix" character varying, "maxParticipants" integer NOT NULL DEFAULT '3', "status" "public"."leagues_status_enum" NOT NULL DEFAULT 'ACTIVE', "is_paid" boolean NOT NULL DEFAULT false, "package_type" character varying NOT NULL DEFAULT 'starter', "branding_logo_url" character varying, "prize_details" text, "prize_image_url" character varying, "prize_type" character varying NOT NULL DEFAULT 'image', "prize_amount" numeric(15,2), "welcome_message" text, "is_enterprise" boolean NOT NULL DEFAULT false, "is_enterprise_active" boolean NOT NULL DEFAULT false, "company_name" character varying, "enable_department_war" boolean NOT NULL DEFAULT false, "brand_color_primary" character varying NOT NULL DEFAULT '#00E676', "brand_color_secondary" character varying NOT NULL DEFAULT '#1E293B', "brand_color_bg" character varying NOT NULL DEFAULT '#0F172A', "brand_color_text" character varying NOT NULL DEFAULT '#F8FAFC', "brand_font_family" character varying NOT NULL DEFAULT '"Russo One", sans-serif', "brand_color_heading" character varying NOT NULL DEFAULT '#FFFFFF', "brand_color_bars" character varying NOT NULL DEFAULT '#00E676', "brand_cover_url" character varying, "admin_name" character varying, "admin_phone" character varying, "social_instagram" character varying, "social_facebook" character varying, "social_whatsapp" character varying, "social_youtube" character varying, "social_tiktok" character varying, "social_linkedin" character varying, "social_website" character varying, "show_ads" boolean NOT NULL DEFAULT false, "ad_images" text, "organization_id" uuid, "creator_id" uuid, CONSTRAINT "PK_2275e1e3e32e9223298c3a0b514" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."access_codes_status_enum" AS ENUM('AVAILABLE', 'USED', 'REVOKED')`);
        await queryRunner.query(`CREATE TABLE "access_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "status" "public"."access_codes_status_enum" NOT NULL DEFAULT 'AVAILABLE', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "used_at" TIMESTAMP WITH TIME ZONE, "league_id" uuid NOT NULL, "used_by_user_id" uuid, CONSTRAINT "UQ_cf1a3218f2a87daf675830a0a76" UNIQUE ("code"), CONSTRAINT "PK_702e128569c0cdfeb9cea561cdb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('INFO', 'SUCCESS', 'WARNING', 'PROMO')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "message" text NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'INFO', "is_read" boolean NOT NULL DEFAULT false, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'LEAGUE_MANAGER', 'PLAYER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying, "google_id" character varying, "full_name" character varying NOT NULL, "nickname" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'PLAYER', "avatar_url" character varying, "phone_number" character varying, "is_verified" boolean NOT NULL DEFAULT false, "is_banned" boolean NOT NULL DEFAULT false, "has_paid" boolean NOT NULL DEFAULT false, "verification_code" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_brackets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournamentId" character varying NOT NULL DEFAULT 'WC2026', "userId" uuid NOT NULL, "leagueId" uuid, "picks" jsonb NOT NULL DEFAULT '{}', "points" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2ef58e7b81bd3558783528b5831" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('PENDING', 'PAID', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournamentId" character varying NOT NULL DEFAULT 'WC2026', "amount" numeric(10,2) NOT NULL DEFAULT '50000', "image_url" character varying, "admin_notes" character varying, "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'PENDING', "reference_code" character varying NOT NULL, "package_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "league_id" uuid, CONSTRAINT "UQ_e29011bc90d42a7b0524d3c88c8" UNIQUE ("reference_code"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_da87c55b3bbbe96c6ed88ea7ee" ON "transactions" ("status") `);
        await queryRunner.query(`CREATE TABLE "system_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" text NOT NULL, CONSTRAINT "UQ_eedd3cd0f227c7fb5eff2204e93" UNIQUE ("key"), CONSTRAINT "PK_db4e70ac0d27e588176e9bb44a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bonus_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" character varying NOT NULL, "points" integer NOT NULL, "tournamentId" character varying NOT NULL DEFAULT 'WC2026', "correctAnswer" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "league_id" uuid, "type" character varying NOT NULL DEFAULT 'OPEN', "options" text, CONSTRAINT "PK_4eb25974e1349cc51e77ffa1779" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_bonus_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "questionId" uuid NOT NULL, "answer" character varying NOT NULL, "pointsEarned" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5da510e0a2c73b08ad928eeb8e9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "league_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "image_url" character varying, "likes" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "league_id" uuid, "user_id" uuid, CONSTRAINT "PK_adffad49091749a3391bd2e0ae3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_standing_overrides" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournamentId" character varying NOT NULL DEFAULT 'WC2026', "group" character varying NOT NULL, "team" character varying NOT NULL, "manualPosition" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b9121a592598fb78a10ce5e2be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" ADD "tournamentId" character varying NOT NULL DEFAULT 'WC2026'`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" ADD "is_manually_locked" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" DROP CONSTRAINT "UQ_b60739b3b33271d04a1b9b218fd"`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" ADD CONSTRAINT "UQ_5f266b300c0ac6a19eabd30bc47" UNIQUE ("phase", "tournamentId")`);
        await queryRunner.query(`ALTER TABLE "predictions" ADD CONSTRAINT "FK_cd3302a5d7d146da1e001ace2bd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "predictions" ADD CONSTRAINT "FK_3458aa50ebcc2f3df1d720161a3" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD CONSTRAINT "FK_e08c0b40ce104f44edf060126fe" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "league_participants" ADD CONSTRAINT "FK_307a4d14441f7151e5f95f1f013" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "league_participants" ADD CONSTRAINT "FK_fd844883ab458626992bd15b296" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "league_prizes" ADD CONSTRAINT "FK_714cc362dbe7ab5683c95641a13" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "league_banners" ADD CONSTRAINT "FK_fc555259846c588451675a6c481" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD CONSTRAINT "FK_c058962b84b18f949406286e519" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD CONSTRAINT "FK_e4e6f4f37c69a6cc5ae611939e7" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_codes" ADD CONSTRAINT "FK_7959b6b598239fbed99ca80ac2a" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_codes" ADD CONSTRAINT "FK_1679ba9d54cc436cb51ff7a1d47" FOREIGN KEY ("used_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_brackets" ADD CONSTRAINT "FK_30e85c0d2a65dd4bfe3a0857797" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_brackets" ADD CONSTRAINT "FK_f00a69a2ea1d57b2d7f06d4075d" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_92524c8d762a41d75c3e0bf923c" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bonus_questions" ADD CONSTRAINT "FK_11e329a6baea0aeee98bfb4d6ad" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_bonus_answers" ADD CONSTRAINT "FK_7fef12990f6f73dc289e55e04fe" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_bonus_answers" ADD CONSTRAINT "FK_755dae46cb8be9d287e965318ad" FOREIGN KEY ("questionId") REFERENCES "bonus_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "league_comments" ADD CONSTRAINT "FK_0664c21c0ee7003a43832875645" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "league_comments" ADD CONSTRAINT "FK_b609e25505c146376f71fc674f7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "league_comments" DROP CONSTRAINT "FK_b609e25505c146376f71fc674f7"`);
        await queryRunner.query(`ALTER TABLE "league_comments" DROP CONSTRAINT "FK_0664c21c0ee7003a43832875645"`);
        await queryRunner.query(`ALTER TABLE "user_bonus_answers" DROP CONSTRAINT "FK_755dae46cb8be9d287e965318ad"`);
        await queryRunner.query(`ALTER TABLE "user_bonus_answers" DROP CONSTRAINT "FK_7fef12990f6f73dc289e55e04fe"`);
        await queryRunner.query(`ALTER TABLE "bonus_questions" DROP CONSTRAINT "FK_11e329a6baea0aeee98bfb4d6ad"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_92524c8d762a41d75c3e0bf923c"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`);
        await queryRunner.query(`ALTER TABLE "user_brackets" DROP CONSTRAINT "FK_f00a69a2ea1d57b2d7f06d4075d"`);
        await queryRunner.query(`ALTER TABLE "user_brackets" DROP CONSTRAINT "FK_30e85c0d2a65dd4bfe3a0857797"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "access_codes" DROP CONSTRAINT "FK_1679ba9d54cc436cb51ff7a1d47"`);
        await queryRunner.query(`ALTER TABLE "access_codes" DROP CONSTRAINT "FK_7959b6b598239fbed99ca80ac2a"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP CONSTRAINT "FK_e4e6f4f37c69a6cc5ae611939e7"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP CONSTRAINT "FK_c058962b84b18f949406286e519"`);
        await queryRunner.query(`ALTER TABLE "league_banners" DROP CONSTRAINT "FK_fc555259846c588451675a6c481"`);
        await queryRunner.query(`ALTER TABLE "league_prizes" DROP CONSTRAINT "FK_714cc362dbe7ab5683c95641a13"`);
        await queryRunner.query(`ALTER TABLE "league_participants" DROP CONSTRAINT "FK_fd844883ab458626992bd15b296"`);
        await queryRunner.query(`ALTER TABLE "league_participants" DROP CONSTRAINT "FK_307a4d14441f7151e5f95f1f013"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP CONSTRAINT "FK_e08c0b40ce104f44edf060126fe"`);
        await queryRunner.query(`ALTER TABLE "predictions" DROP CONSTRAINT "FK_3458aa50ebcc2f3df1d720161a3"`);
        await queryRunner.query(`ALTER TABLE "predictions" DROP CONSTRAINT "FK_cd3302a5d7d146da1e001ace2bd"`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" DROP CONSTRAINT "UQ_5f266b300c0ac6a19eabd30bc47"`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" ADD CONSTRAINT "UQ_b60739b3b33271d04a1b9b218fd" UNIQUE ("phase")`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" DROP COLUMN "is_manually_locked"`);
        await queryRunner.query(`ALTER TABLE "knockout_phase_status" DROP COLUMN "tournamentId"`);
        await queryRunner.query(`DROP TABLE "group_standing_overrides"`);
        await queryRunner.query(`DROP TABLE "league_comments"`);
        await queryRunner.query(`DROP TABLE "user_bonus_answers"`);
        await queryRunner.query(`DROP TABLE "bonus_questions"`);
        await queryRunner.query(`DROP TABLE "system_config"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da87c55b3bbbe96c6ed88ea7ee"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TABLE "user_brackets"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "access_codes"`);
        await queryRunner.query(`DROP TYPE "public"."access_codes_status_enum"`);
        await queryRunner.query(`DROP TABLE "leagues"`);
        await queryRunner.query(`DROP TYPE "public"."leagues_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."leagues_type_enum"`);
        await queryRunner.query(`DROP TABLE "league_banners"`);
        await queryRunner.query(`DROP TABLE "league_prizes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_564e0b5f83f3b1b6eabb0d1bf3"`);
        await queryRunner.query(`DROP TABLE "league_participants"`);
        await queryRunner.query(`DROP TYPE "public"."league_participants_status_enum"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3458aa50ebcc2f3df1d720161a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ea301bcc3c985841fe18f6ab5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8dbffbd0f32db4e14484eba1de"`);
        await queryRunner.query(`DROP TABLE "predictions"`);
        await queryRunner.query(`DROP TABLE "matches"`);
        await queryRunner.query(`DROP TABLE "system_settings"`);
    }

}
