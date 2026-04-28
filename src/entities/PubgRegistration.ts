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

  @Column({ type: "timestamptz" })
  registered_at: Date;

  @ManyToOne(() => Tournament, { onDelete: "CASCADE" })
  tournament: Tournament;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: "pubg_registration_friends", 
    joinColumn: {
      name: "registration_id",
      referencedColumnName: "id",
      foreignKeyConstraintName: "FK_pubg_registration_friends_registration",
    },
    inverseJoinColumn: {
      name: "friend_id",
      referencedColumnName: "id",
      foreignKeyConstraintName: "FK_pubg_registration_friends_friend",
    },
  })
  friends: User[];

  @UpdateDateColumn()
  updated_at: Date;
}