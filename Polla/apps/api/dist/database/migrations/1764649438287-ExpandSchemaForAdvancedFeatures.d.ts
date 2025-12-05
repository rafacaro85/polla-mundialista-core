import { MigrationInterface, QueryRunner } from "typeorm";
export declare class ExpandSchemaForAdvancedFeatures1764649438287 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
