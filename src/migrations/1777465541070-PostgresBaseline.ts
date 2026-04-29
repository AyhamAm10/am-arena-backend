import { MigrationInterface, QueryRunner } from "typeorm";

export class PostgresBaseline1777465541070 implements MigrationInterface {
    name = 'PostgresBaseline1777465541070'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" ADD "survivor_achievement_id" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "survivor_achievement_id"`);
    }

}
