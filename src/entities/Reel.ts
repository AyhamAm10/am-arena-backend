import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { ReelComment } from "./ReelComment";
import { ReelLike } from "./ReelLike";

@Entity({ name: "reels" })
export class Reel {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.reels)
  user: User;

  @Column()
  title: string;

  @Column()
  video_url: string;

  @Column({ nullable: true })
  video_public_id: string | null;

  @Column({ type: "text" })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ReelComment, comment => comment.reel)
  comments: ReelComment[];

  @OneToMany(() => ReelLike, like => like.reel)
  likes: ReelLike[];
}