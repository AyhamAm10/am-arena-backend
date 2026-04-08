import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1774899058273 implements MigrationInterface {
    name = 'Test1774899058273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_user_notifications_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_notifications_user_created"`);
        await queryRunner.query(`ALTER TABLE "chat_members" ADD "role" character varying NOT NULL DEFAULT 'member'`);
        await queryRunner.query(`ALTER TABLE "user_notifications" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_ae9b1d1f1fe780ef8e3e7d0c0f6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_ae9b1d1f1fe780ef8e3e7d0c0f6"`);
        await queryRunner.query(`ALTER TABLE "user_notifications" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat_members" DROP COLUMN "role"`);
        await queryRunner.query(`CREATE INDEX "IDX_user_notifications_user_created" ON "user_notifications" ("user_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_user_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
