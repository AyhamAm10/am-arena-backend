import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Tournament } from "./Tournament";
import { User } from "./User";

@Entity({ name: "pubg_registrations" })
export class PubgRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tournament)
  tournament: Tournament;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: false })
  paid: boolean;

  @Column({ nullable: true })
  payment_method: string;

  @Column({ type: "timestamp" })
  registered_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}