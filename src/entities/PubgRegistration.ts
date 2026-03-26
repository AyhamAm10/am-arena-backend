import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Tournament } from "./Tournament";
import { User } from "./User";

@Entity({ name: "pubg_registrations" })
export class PubgRegistration {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  paid: boolean;

  @Column({ nullable: true })
  payment_method: string;

  @Column({ type: "timestamp" })
  registered_at: Date;

  @ManyToOne(() => Tournament)
  tournament: Tournament;

  @ManyToOne(() => User)
  user: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: "pubg_registration_friends", 
    joinColumn: { name: "registration_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "friend_id", referencedColumnName: "id" },
  })
  friends: User[];

  

  @UpdateDateColumn()
  updated_at: Date;
}