import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1774750617398 implements MigrationInterface {
    name = 'Test1774750617398'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_achievements" ADD "displayed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_achievements" DROP COLUMN "displayed"`);
    }

}
