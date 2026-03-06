// src/entities/Chat.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './User';
import { Message } from './Message';
import { Tournament } from './Tournament';

export enum ChatType {
  DIRECT = 'direct',
  CHANNEL = 'channel',
}

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ChatType })
  type: ChatType;

  @Column({ nullable: true })
  title: string;

  @Column({ default: true })
  allow_user_messages: boolean;

  @ManyToOne(() => User, (user) => user.chats_created)
  created_by: User;

  @ManyToOne(() => Tournament, { nullable: true })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Message, (msg) => msg.chat)
  messages: Message[];
}