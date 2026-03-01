import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Reel } from "./Reel";
import { User } from "./User";

@Entity({ name: "reel_likes" })
export class ReelLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Reel, reel => reel.likes)
  reel: Reel;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  created_at: Date;
}