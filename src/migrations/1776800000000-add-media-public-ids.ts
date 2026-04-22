import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMediaPublicIds1776800000000 implements MigrationInterface {
  name = "AddMediaPublicIds1776800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "achievements" ADD "icon_public_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "hero_content" ADD "image_public_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "reels" ADD "video_public_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "pubg_game" ADD "image_public_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pubg_game" DROP COLUMN "image_public_id"`);
    await queryRunner.query(`ALTER TABLE "reels" DROP COLUMN "video_public_id"`);
    await queryRunner.query(`ALTER TABLE "hero_content" DROP COLUMN "image_public_id"`);
    await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "icon_public_id"`);
  }
}
