import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Reel } from "./Reel";
import { User } from "./User";

@Entity({ name: "reel_comments" })
export class ReelComment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Reel, reel => reel.comments)
  reel: Reel;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: "text" })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}