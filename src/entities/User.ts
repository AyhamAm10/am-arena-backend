// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';

import { Message } from './Message';
import { Chat } from './Chat';
import { Tournament } from './Tournament';
import { PubgRegistration } from './PubgRegistration';
import { Reel } from './Reel';
import { Friend } from './Friend';
import { UserAchievement } from './UserAchievement';


export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string;

  @Column()
  gamer_name: string;

  @Column({ nullable: true })
  profile_picture_url: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'decimal', default: 0 })
  coins: number;

  @Column({ type: 'int', default: 0 })
  xp_points: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => Tournament, (tournament) => tournament.created_by)
  created_tournaments: Tournament[];

  @OneToMany(() => PubgRegistration, (reg) => reg.user)
  registrations: PubgRegistration[];

  @OneToMany(() => Reel, (reel) => reel.user)
  reels: Reel[];

  @OneToMany(() => Message, (msg) => msg.sender)
  messages: Message[];

  @OneToMany(() => Chat, (chat) => chat.created_by)
  chats_created: Chat[];

  @OneToMany(() => Friend, (f) => f.user)
  friends: Friend[];

  @OneToMany(() => UserAchievement, (ua) => ua.user)
  achievements: UserAchievement[];

  @ManyToMany(() => Tournament, (tournament) => tournament.winners)
  wonTournaments: Tournament[];
}