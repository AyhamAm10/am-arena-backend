import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { UserAchievement } from "./UserAchievement";


export enum AchievementType {
  TOURNAMENT_JOIN = 'tournament_join',
  TOURNAMENT_WIN = 'tournament_win',
  TOURNAMENT_RANK = 'tournament_rank',
  POLL_PARTICIPATION = 'poll_participation',
  POLL_WIN = 'poll_win',
  HIGHLIGHT = 'highlight',
  CUSTOM = 'custom',
  EVENT_SPECIAL = 'event_special'
}


@Entity({ name: "achievements" })
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column({ nullable: true })
  color_theme: string;

  @Column()
  icon_url: string;

  @Column({ type: "int", default: 0 })
  xp_reward: number;

  @Column({ default: false })
  repeatable: boolean;

  @Column({
    type: 'enum',
    enum: AchievementType,
    default: AchievementType.CUSTOM
  })
  type: AchievementType;

  @Column({ type: "enum", enum: ["progress", "event", "manual"], default: "manual" })
  logic_type: "progress" | "event" | "manual";

  @Column({ type: "int", nullable: true })
  target: number | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => UserAchievement, ua => ua.achievement)
  user_achievements: UserAchievement[];
}