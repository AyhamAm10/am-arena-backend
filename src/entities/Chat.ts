// src/entities/Chat.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Message } from './Message';

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

  @ManyToOne(() => User, (user) => user.chats_created)
  created_by: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Message, (msg) => msg.chat)
  messages: Message[];
}