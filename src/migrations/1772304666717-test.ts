import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1772304666717 implements MigrationInterface {
    name = 'Test1772304666717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."chats_type_enum" AS ENUM('direct', 'channel')`);
        await queryRunner.query(`CREATE TABLE "chats" ("id" SERIAL NOT NULL, "type" "public"."chats_type_enum" NOT NULL, "title" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" SERIAL NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "chatId" integer, "senderId" integer, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tournaments" ("id" SERIAL NOT NULL, "game_type" character varying NOT NULL, "game_ref_id" integer NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "type" character varying NOT NULL, "entry_fee" numeric NOT NULL, "prize_pool" numeric NOT NULL, "max_players" integer NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, CONSTRAINT "PK_6d5d129da7a80cf99e8ad4833a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pubg_registrations" ("id" SERIAL NOT NULL, "paid" boolean NOT NULL DEFAULT false, "payment_method" character varying, "registered_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "tournamentId" integer, "userId" integer, CONSTRAINT "PK_a9033a45a4b47d04096a53367b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reel_comments" ("id" SERIAL NOT NULL, "comment" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "reelId" integer, "userId" integer, CONSTRAINT "PK_b38c18cfafa042b7714e32ef837" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reel_likes" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "reelId" integer, "userId" integer, CONSTRAINT "PK_5496eac4580cf69396c81ab7b6d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reels" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "video_url" character varying NOT NULL, "description" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_e5ecdc818bad986f1eb0a5d7a2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."friends_status_enum" AS ENUM('pending', 'accepted', 'blocked')`);
        await queryRunner.query(`CREATE TABLE "friends" ("user_id" integer NOT NULL, "friend_user_id" integer NOT NULL, "status" "public"."friends_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "friendId" integer, CONSTRAINT "PK_f46da3e4cf7f25532a157587c35" PRIMARY KEY ("user_id", "friend_user_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin', 'super_admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "full_name" character varying NOT NULL, "gamer_name" character varying NOT NULL, "profile_picture_url" character varying, "email" character varying NOT NULL, "phone" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "is_active" boolean NOT NULL DEFAULT true, "coins" numeric NOT NULL DEFAULT '0', "xp_points" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_achievements" ("id" SERIAL NOT NULL, "obtained_at" TIMESTAMP NOT NULL, "userId" integer, "achievementId" integer, CONSTRAINT "PK_3d94aba7e9ed55365f68b5e77fa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "achievements" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "color_theme" character varying, "icon_url" character varying NOT NULL, "xp_reward" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bc19c37c6249f70186f318d71d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."pubg_game_type_enum" AS ENUM('solo', 'duo', 'squad')`);
        await queryRunner.query(`CREATE TABLE "pubg_game" ("id" SERIAL NOT NULL, "type" "public"."pubg_game_type_enum" NOT NULL, "map" character varying NOT NULL, "max_players" integer NOT NULL, "entry_fee" numeric NOT NULL, "prize_pool" numeric NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_50030a17345ef372f03723490d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."pubg_registration_fields_type_enum" AS ENUM('string', 'number', 'boolean', 'select')`);
        await queryRunner.query(`CREATE TABLE "pubg_registration_fields" ("id" SERIAL NOT NULL, "label" character varying NOT NULL, "type" "public"."pubg_registration_fields_type_enum" NOT NULL, "options" text, "required" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "tournamentId" integer, CONSTRAINT "PK_6ee8dad5c72e2d38bbcd40d6481" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pubg_registration_field_values" ("id" SERIAL NOT NULL, "value" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer, "fieldId" integer, CONSTRAINT "PK_feea13182ab5d27e72703ba07fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_fa7cbf53930e01a370b3841a1bc" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_36bc604c820bb9adc4c75cd4115" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tournaments" ADD CONSTRAINT "FK_5ff236c228350de491d16d3a78d" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pubg_registrations" ADD CONSTRAINT "FK_2caf2bf5bfac04e7a2a18ead5bd" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pubg_registrations" ADD CONSTRAINT "FK_cad3b829ce0016d7ad12cae3a0e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reel_comments" ADD CONSTRAINT "FK_246099081e9f2ad3e120a131f9f" FOREIGN KEY ("reelId") REFERENCES "reels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reel_comments" ADD CONSTRAINT "FK_0caf86b86e8ff78b362a866cf58" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reel_likes" ADD CONSTRAINT "FK_786307fb6852744f867a7da8fbf" FOREIGN KEY ("reelId") REFERENCES "reels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reel_likes" ADD CONSTRAINT "FK_52f522090c41ae6c4d90edff020" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reels" ADD CONSTRAINT "FK_a6c4a1abb80e3e35063cf2421f1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friends" ADD CONSTRAINT "FK_0c4c4b18d8a52c580213a40c084" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friends" ADD CONSTRAINT "FK_867f9b37dcc79035fa20e8ffe5e" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_3ac6bc9da3e8a56f3f7082012dd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_6a5a5816f54d0044ba5f3dc2b74" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pubg_registration_fields" ADD CONSTRAINT "FK_6cad066ed90e190e279674a33fa" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pubg_registration_field_values" ADD CONSTRAINT "FK_05bc85dbe1434713d37678d4db0" FOREIGN KEY ("registrationId") REFERENCES "pubg_registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pubg_registration_field_values" ADD CONSTRAINT "FK_813fbb5e9e28dc225c9a2d70eb6" FOREIGN KEY ("fieldId") REFERENCES "pubg_registration_fields"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pubg_registration_field_values" DROP CONSTRAINT "FK_813fbb5e9e28dc225c9a2d70eb6"`);
        await queryRunner.query(`ALTER TABLE "pubg_registration_field_values" DROP CONSTRAINT "FK_05bc85dbe1434713d37678d4db0"`);
        await queryRunner.query(`ALTER TABLE "pubg_registration_fields" DROP CONSTRAINT "FK_6cad066ed90e190e279674a33fa"`);
        await queryRunner.query(`ALTER TABLE "user_achievements" DROP CONSTRAINT "FK_6a5a5816f54d0044ba5f3dc2b74"`);
        await queryRunner.query(`ALTER TABLE "user_achievements" DROP CONSTRAINT "FK_3ac6bc9da3e8a56f3f7082012dd"`);
        await queryRunner.query(`ALTER TABLE "friends" DROP CONSTRAINT "FK_867f9b37dcc79035fa20e8ffe5e"`);
        await queryRunner.query(`ALTER TABLE "friends" DROP CONSTRAINT "FK_0c4c4b18d8a52c580213a40c084"`);
        await queryRunner.query(`ALTER TABLE "reels" DROP CONSTRAINT "FK_a6c4a1abb80e3e35063cf2421f1"`);
        await queryRunner.query(`ALTER TABLE "reel_likes" DROP CONSTRAINT "FK_52f522090c41ae6c4d90edff020"`);
        await queryRunner.query(`ALTER TABLE "reel_likes" DROP CONSTRAINT "FK_786307fb6852744f867a7da8fbf"`);
        await queryRunner.query(`ALTER TABLE "reel_comments" DROP CONSTRAINT "FK_0caf86b86e8ff78b362a866cf58"`);
        await queryRunner.query(`ALTER TABLE "reel_comments" DROP CONSTRAINT "FK_246099081e9f2ad3e120a131f9f"`);
        await queryRunner.query(`ALTER TABLE "pubg_registrations" DROP CONSTRAINT "FK_cad3b829ce0016d7ad12cae3a0e"`);
        await queryRunner.query(`ALTER TABLE "pubg_registrations" DROP CONSTRAINT "FK_2caf2bf5bfac04e7a2a18ead5bd"`);
        await queryRunner.query(`ALTER TABLE "tournaments" DROP CONSTRAINT "FK_5ff236c228350de491d16d3a78d"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_36bc604c820bb9adc4c75cd4115"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_fa7cbf53930e01a370b3841a1bc"`);
        await queryRunner.query(`DROP TABLE "pubg_registration_field_values"`);
        await queryRunner.query(`DROP TABLE "pubg_registration_fields"`);
        await queryRunner.query(`DROP TYPE "public"."pubg_registration_fields_type_enum"`);
        await queryRunner.query(`DROP TABLE "pubg_game"`);
        await queryRunner.query(`DROP TYPE "public"."pubg_game_type_enum"`);
        await queryRunner.query(`DROP TABLE "achievements"`);
        await queryRunner.query(`DROP TABLE "user_achievements"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "friends"`);
        await queryRunner.query(`DROP TYPE "public"."friends_status_enum"`);
        await queryRunner.query(`DROP TABLE "reels"`);
        await queryRunner.query(`DROP TABLE "reel_likes"`);
        await queryRunner.query(`DROP TABLE "reel_comments"`);
        await queryRunner.query(`DROP TABLE "pubg_registrations"`);
        await queryRunner.query(`DROP TABLE "tournaments"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "chats"`);
        await queryRunner.query(`DROP TYPE "public"."chats_type_enum"`);
    }

}
