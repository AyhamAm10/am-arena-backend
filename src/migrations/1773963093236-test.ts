import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1773963093236 implements MigrationInterface {
    name = 'Test1773963093236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pubg_game" ADD "image" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tournaments" ALTER COLUMN "start_date" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tournaments" ALTER COLUMN "end_date" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" ALTER COLUMN "end_date" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tournaments" ALTER COLUMN "start_date" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pubg_game" DROP COLUMN "image"`);
    }

}
