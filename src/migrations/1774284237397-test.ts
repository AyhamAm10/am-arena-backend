import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1774284237397 implements MigrationInterface {
    name = 'Test1774284237397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hero_content" ("id" SERIAL NOT NULL, "image" character varying NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fc1b31914af0485de046d765a02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tournament_winners" ("tournament_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_2de1387608834af3170dc8cfe99" PRIMARY KEY ("tournament_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_39de76fe7a3738e77e0859eb54" ON "tournament_winners" ("tournament_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_dd6a7a1c94ca4da211c5df662e" ON "tournament_winners" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "tournament_winners" ADD CONSTRAINT "FK_39de76fe7a3738e77e0859eb548" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tournament_winners" ADD CONSTRAINT "FK_dd6a7a1c94ca4da211c5df662ec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournament_winners" DROP CONSTRAINT "FK_dd6a7a1c94ca4da211c5df662ec"`);
        await queryRunner.query(`ALTER TABLE "tournament_winners" DROP CONSTRAINT "FK_39de76fe7a3738e77e0859eb548"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd6a7a1c94ca4da211c5df662e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_39de76fe7a3738e77e0859eb54"`);
        await queryRunner.query(`DROP TABLE "tournament_winners"`);
        await queryRunner.query(`DROP TABLE "hero_content"`);
    }

}
