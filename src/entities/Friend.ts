import { Entity, Column, PrimaryColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
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

  @ManyToOne(() => User, (user) => user.friends, { onDelete: "CASCADE" })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: 'friend_user_id' })
  friend: User;


  @Column({
    type: "enum",
    enum: FriendStatus,
    enumName: "friend_status_enum",
    default: FriendStatus.PENDING,
  })
  status: FriendStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}