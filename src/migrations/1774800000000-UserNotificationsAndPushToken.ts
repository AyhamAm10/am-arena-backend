import { MigrationInterface, QueryRunner } from "typeorm";

export class UserNotificationsAndPushToken1774800000000 implements MigrationInterface {
  name = "UserNotificationsAndPushToken1774800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD "expo_push_token" text
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD "expo_push_token_updated_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      CREATE TABLE "user_notifications" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "type" character varying(64) NOT NULL,
        "title" character varying(512) NOT NULL,
        "body" text NOT NULL,
        "data" jsonb,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_notifications_user_created" ON "user_notifications" ("user_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_notifications_user_created"`);
    await queryRunner.query(`DROP TABLE "user_notifications"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "expo_push_token_updated_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "expo_push_token"`);
  }
}
