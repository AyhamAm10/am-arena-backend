import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1776640966720 implements MigrationInterface {
    name = 'Test1776640966720'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, "creator_id" integer, "reel_id" integer, "comment_id" integer, CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_tags_user_comment" ON "tags" ("user_id", "comment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tags_comment" ON "tags" ("comment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tags_reel" ON "tags" ("reel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tags_creator" ON "tags" ("creator_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tags_user" ON "tags" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_public_id" character varying`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_74603743868d1e4f4fc2c0225b6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_78e65343656c6c8895a87e1efb5" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_41b544c249ff02e601366c8ca1a" FOREIGN KEY ("reel_id") REFERENCES "reels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_8a6937203e0ba1d52dcedf575f1" FOREIGN KEY ("comment_id") REFERENCES "reel_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_8a6937203e0ba1d52dcedf575f1"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_41b544c249ff02e601366c8ca1a"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_78e65343656c6c8895a87e1efb5"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_74603743868d1e4f4fc2c0225b6"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_public_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tags_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tags_creator"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tags_reel"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tags_comment"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_tags_user_comment"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
