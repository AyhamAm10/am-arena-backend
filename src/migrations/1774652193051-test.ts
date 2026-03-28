import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1774652193051 implements MigrationInterface {
    name = 'Test1774652193051'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournament_winners" DROP CONSTRAINT "FK_dd6a7a1c94ca4da211c5df662ec"`);
        await queryRunner.query(`ALTER TABLE "tournament_winners" ADD CONSTRAINT "FK_dd6a7a1c94ca4da211c5df662ec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournament_winners" DROP CONSTRAINT "FK_dd6a7a1c94ca4da211c5df662ec"`);
        await queryRunner.query(`ALTER TABLE "tournament_winners" ADD CONSTRAINT "FK_dd6a7a1c94ca4da211c5df662ec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
