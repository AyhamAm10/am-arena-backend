import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Poll } from "./Poll";
import { PollOption } from "./PollOption";
import { User } from "./User";

@Entity('votes')
@Unique("UQ_votes_poll_user", ["poll", "user"])
@Index("IDX_votes_poll", ["poll"])
@Index("IDX_votes_option", ["option"])
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Poll, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: "pollId" })
  poll: Poll;

  @ManyToOne(() => PollOption, (option) => option.votes, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: "optionId" })
  option: PollOption;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: "userId" })
  user: User;

  @CreateDateColumn()
  created_at: Date;
}