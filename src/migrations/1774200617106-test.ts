import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1774200617106 implements MigrationInterface {
    name = 'Test1774200617106'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_4282ee05757f66b9a92d26c3256"`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_4282ee05757f66b9a92d26c3256" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_4282ee05757f66b9a92d26c3256"`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_4282ee05757f66b9a92d26c3256" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
