import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Chat } from './Chat';
import { User } from './User';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: "CASCADE" })
  chat: Chat;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: "CASCADE" })
  sender: User;

  @Column('text')
  content: string;

  @Column({
    type: "enum",
    enum: ["text", "cta", "poll", "navigation"],
    enumName: "message_type_enum",
    default: "text",
  })

  type: 'text' | 'cta' | 'poll' | 'navigation';


  @Column({ type: "jsonb", nullable: true })
  data: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}