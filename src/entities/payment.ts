import { Column, ManyToOne, OneToMany } from "typeorm";

import { CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { UpdateDateColumn } from "typeorm";
import { Package } from "./package";
import { WalletTransaction } from "./wallet_transaction";

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @ManyToOne(() => Package, (pkg) => pkg.payments, { nullable: false })
  package: Package;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column("int")
  coins: number;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  status: "pending" | "approved" | "rejected";

  @Column({ nullable: true })
  method: string;

  @Column({ nullable: true })
  reference: string;

  @ManyToOne(() => User, { nullable: true })
  approved_by: User;

  @Column({ type: "timestamp", nullable: true })
  approved_at: Date;

  @OneToMany(() => WalletTransaction, (tx) => tx.payment)
  transactions: WalletTransaction[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}