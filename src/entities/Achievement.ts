import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { UserAchievement } from "./UserAchievement";

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => UserAchievement, ua => ua.achievement)
  user_achievements: UserAchievement[];
}