import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatTournamentAndMembers1730812800000 implements MigrationInterface {
  name = "AddChatTournamentAndMembers1730812800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chats" ADD "allow_user_messages" boolean NOT NULL DEFAULT true`
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD "tournament_id" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_tournament" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `CREATE TABLE "chat_members" ("chat_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_chat_members" PRIMARY KEY ("chat_id", "user_id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "chat_members" ADD CONSTRAINT "FK_chat_members_chat" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "chat_members" ADD CONSTRAINT "FK_chat_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_members" DROP CONSTRAINT "FK_chat_members_user"`);
    await queryRunner.query(`ALTER TABLE "chat_members" DROP CONSTRAINT "FK_chat_members_chat"`);
    await queryRunner.query(`DROP TABLE "chat_members"`);
    await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_tournament"`);
    await queryRunner.query(`ALTER TABLE "chats" DROP COLUMN "tournament_id"`);
    await queryRunner.query(`ALTER TABLE "chats" DROP COLUMN "allow_user_messages"`);
  }
}
