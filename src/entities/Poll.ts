import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Tournament } from "./Tournament";
import { PollOption } from "./PollOption";
import { Chat } from "./Chat";
import { Message } from "./Message";

@Entity('polls')
export class Poll {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ type: "text", default: "" })
    description: string;

    @Column({ type: 'simple-enum', enum: ['tournament', 'global', 'message'] })
    type: 'tournament' | 'global' | 'message';

    @ManyToOne(() => Tournament, (t) => t.polls, { nullable: true, onDelete: 'SET NULL' })
    tournament: Tournament | null;

    @ManyToOne(() => Chat, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "chatId" })
    chat: Chat | null;

    @ManyToOne(() => Message, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "messageId" })
    message: Message | null;

    @Column({ type: 'datetime2', nullable: true })
    expires_at: Date | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ default: true })
    is_active: boolean;

    @OneToMany(() => PollOption, (option) => option.poll)
    options: PollOption[];
}