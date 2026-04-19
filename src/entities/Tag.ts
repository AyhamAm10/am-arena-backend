import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Reel } from "./Reel";
import { ReelComment } from "./ReelComment";
import { User } from "./User";

@Entity({ name: "tags" })
@Index("IDX_tags_user", ["user"])
@Index("IDX_tags_creator", ["creator"])
@Index("IDX_tags_reel", ["reel"])
@Index("IDX_tags_comment", ["comment"])
@Index("UQ_tags_user_comment", ["user", "comment"], { unique: true })
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "creator_id" })
  creator: User;

  @ManyToOne(() => Reel, { onDelete: "CASCADE" })
  @JoinColumn({ name: "reel_id" })
  reel: Reel;

  @ManyToOne(() => ReelComment, { onDelete: "CASCADE" })
  @JoinColumn({ name: "comment_id" })
  comment: ReelComment;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
