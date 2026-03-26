import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1774292677758 implements MigrationInterface {
    name = 'Test1774292677758'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pubg_registration_friends" ("registration_id" integer NOT NULL, "friend_id" integer NOT NULL, CONSTRAINT "PK_e29688ca0ca83028338e32c386a" PRIMARY KEY ("registration_id", "friend_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_67386a8b084f5f0b640b7e9738" ON "pubg_registration_friends" ("registration_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_69ce7d01981f95612fc088cc34" ON "pubg_registration_friends" ("friend_id") `);
        await queryRunner.query(`ALTER TABLE "pubg_registration_friends" ADD CONSTRAINT "FK_67386a8b084f5f0b640b7e97380" FOREIGN KEY ("registration_id") REFERENCES "pubg_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "pubg_registration_friends" ADD CONSTRAINT "FK_69ce7d01981f95612fc088cc345" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pubg_registration_friends" DROP CONSTRAINT "FK_69ce7d01981f95612fc088cc345"`);
        await queryRunner.query(`ALTER TABLE "pubg_registration_friends" DROP CONSTRAINT "FK_67386a8b084f5f0b640b7e97380"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_69ce7d01981f95612fc088cc34"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_67386a8b084f5f0b640b7e9738"`);
        await queryRunner.query(`DROP TABLE "pubg_registration_friends"`);
    }

}
