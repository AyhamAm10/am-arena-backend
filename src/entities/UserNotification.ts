import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export type AppNotificationType =
  | "FRIEND_REQUEST"
  | "CHAT_MESSAGE"
  | "TOURNAMENT_CREATED"
  | "ACHIEVEMENT_UNLOCKED"
  | "REEL_HIGHLIGHT"
  | "SYSTEM_MESSAGE"
  | "MANUAL"
  | "GLOBAL_POLL";

@Entity("user_notifications")
export class UserNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.notifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "varchar", length: 64 })
  type: AppNotificationType;

  @Column({ type: "varchar", length: 512 })
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "jsonb", nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: "timestamptz", nullable: true })
  read_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
