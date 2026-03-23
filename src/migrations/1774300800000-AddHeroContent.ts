import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHeroContent1774300800000 implements MigrationInterface {
  name = "AddHeroContent1774300800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hero_content" ("id" SERIAL NOT NULL, "image" character varying NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_hero_content_id" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hero_content"`);
  }
}
