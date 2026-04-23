import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Poll } from "./Poll";
import { User } from "./User";
import { Vote } from "./Vote";

@Entity('poll_options')
export class PollOption {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Poll, (poll) => poll.options, { onDelete: 'NO ACTION' })
  poll: Poll;

  @Column({ nullable: true })
  label: string;

  @Column({ type: 'simple-enum', enum: ['text', 'user'] })
  type: 'text' | 'user';

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "userId" })
  user: User | null;

  @OneToMany(() => Vote, (vote) => vote.option)
  votes: Vote[];
}