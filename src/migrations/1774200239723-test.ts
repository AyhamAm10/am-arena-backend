import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1774200239723 implements MigrationInterface {
    name = 'Test1774200239723'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "pubg_game" DROP COLUMN "max_players"`);
        await queryRunner.query(`ALTER TABLE "pubg_game" DROP COLUMN "entry_fee"`);
        await queryRunner.query(`ALTER TABLE "pubg_game" DROP COLUMN "prize_pool"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pubg_game" ADD "prize_pool" numeric NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pubg_game" ADD "entry_fee" numeric NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pubg_game" ADD "max_players" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tournaments" ADD "type" character varying NOT NULL`);
    }

}
