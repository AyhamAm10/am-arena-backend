import { MigrationInterface, QueryRunner } from "typeorm";

export class PostgresBaseline1777392099048 implements MigrationInterface {
    name = 'PostgresBaseline1777392099048'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" ADD "champion_achievement_id" integer`);
        await queryRunner.query(`ALTER TABLE "tournaments" ADD "audience_achievement_id" integer`);
        await queryRunner.query(`ALTER TABLE "tournaments" ADD "audience_poll_id" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "audience_poll_id"`);
        await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "audience_achievement_id"`);
        await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "champion_achievement_id"`);
    }

}
