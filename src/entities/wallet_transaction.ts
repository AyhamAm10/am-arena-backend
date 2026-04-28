import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Column } from "typeorm";
import { Payment } from "./payment";
import { User } from "./User";
import { Tournament } from "./Tournament";

@Entity("wallet_transactions")
export class WalletTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    nullable: false,
  })
  user: User;

  @Column("int")
  amount: number; 

  @Column({
    type: "enum",
    enum: ["deposit", "spend", "refund"],
    enumName: "wallet_tx_type_enum",
  })
  type: "deposit" | "spend" | "refund";

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    enumName: "wallet_tx_status_enum",
    default: "pending",
  })
  status: "pending" | "approved" | "rejected";

  @ManyToOne(() => Payment, (payment) => payment.transactions, {
    nullable: true,
    onDelete: "SET NULL",
  })
  payment: Payment;

  @ManyToOne(() => Tournament, { nullable: true, onDelete: "SET NULL" })
  tournament: Tournament;

  @CreateDateColumn()
  created_at: Date;
}