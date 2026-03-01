import { Entity, Column, PrimaryColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

export enum FriendStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked',
}

@Entity('friends')
export class Friend {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn()
  friend_user_id: number;

  @ManyToOne(() => User, (user) => user.friends)
  user: User;

  @ManyToOne(() => User)
  friend: User;

  @Column({ type: 'enum', enum: FriendStatus, default: FriendStatus.PENDING })
  status: FriendStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}