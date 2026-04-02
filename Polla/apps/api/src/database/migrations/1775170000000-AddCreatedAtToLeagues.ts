import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtToLeagues1775170000000 implements MigrationInterface {
    name = 'AddCreatedAtToLeagues1775170000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // NO-OP: Migration disabled to prevent production crash
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // NO-OP
    }
}
