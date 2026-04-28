import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Chat } from './Chat';
import { User } from './User';

@Entity('chat_members')
export class ChatMember {
  @PrimaryColumn()
  chat_id: number;

  @PrimaryColumn()
  user_id: number;

  @ManyToOne(() => Chat, { onDelete: "CASCADE" })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'member' })
  role: 'admin' | 'member';
}
