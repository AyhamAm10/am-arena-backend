import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Reel } from "./Reel";
import { Tournament } from "./Tournament";
import { User } from "./User";

@Entity({ name: "highlights" })
export class Highlight {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Tournament, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "tournament_id" })
  tournament: Tournament | null;

  @ManyToOne(() => Reel, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "reel_id" })
  reel: Reel | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
