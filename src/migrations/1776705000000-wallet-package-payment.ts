import { MigrationInterface, QueryRunner } from "typeorm";

export class WalletPackagePayment1776705000000 implements MigrationInterface {
  name = "WalletPackagePayment1776705000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "packages" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "coins" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_packages_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "wallets" ("id" SERIAL NOT NULL, "balance" integer NOT NULL DEFAULT 0, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, CONSTRAINT "REL_wallets_userId" UNIQUE ("userId"), CONSTRAINT "PK_wallets_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "payments" ("id" SERIAL NOT NULL, "price" numeric(10,2) NOT NULL, "coins" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "method" character varying, "reference" character varying, "approved_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "packageId" integer NOT NULL, "approvedById" integer, CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "wallet_transactions" ("id" SERIAL NOT NULL, "amount" integer NOT NULL, "type" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "paymentId" integer, "tournamentId" integer, CONSTRAINT "PK_wallet_transactions_id" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_wallets_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_package" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_approved_by" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_tx_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_tx_payment" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_tx_tournament" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT IF EXISTS "FK_wallet_tx_tournament"`);
    await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT IF EXISTS "FK_wallet_tx_payment"`);
    await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT IF EXISTS "FK_wallet_tx_user"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_approved_by"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_package"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_user"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "FK_wallets_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallet_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "packages"`);
  }
}
