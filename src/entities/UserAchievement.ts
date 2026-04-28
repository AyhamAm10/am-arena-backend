import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { User } from "./User";
import { Achievement } from "./Achievement";

@Entity({ name: "user_achievements" })
export class UserAchievement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.achievements, { onDelete: "CASCADE" })
  user: User;

  @ManyToOne(() => Achievement, achievement => achievement.user_achievements, { onDelete: "CASCADE" })
  achievement: Achievement;

  @Column({ type: "timestamptz" })
  obtained_at: Date;

  @Column({ default: false })
  displayed: boolean;
}