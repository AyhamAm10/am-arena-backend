// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToMany, ManyToOne, OneToOne, JoinColumn } from "typeorm";

import { Message } from './Message';
import { Chat } from './Chat';
import { Tournament } from './Tournament';
import { PubgRegistration } from './PubgRegistration';
import { Reel } from './Reel';
import { Friend } from './Friend';
import { UserAchievement } from './UserAchievement';
import { UserNotification } from './UserNotification';
import { Achievement } from "./Achievement";
import { Wallet } from "./wallet";
import { WalletTransaction } from "./wallet_transaction";
import { Payment } from "./payment";


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

  @Column({ nullable: true })
  avatar_public_id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  country: string | null;

  @Column()
  password_hash: string;

  @Column({ type: "enum", enum: UserRole, enumName: "user_role_enum", default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'decimal', default: 0 })
  coins: number;

  @Column({ type: 'int', default: 0 })
  xp_points: number;

  @Column({ type: 'text', nullable: true })
  expo_push_token: string | null;

  @Column({ type: "timestamptz", nullable: true })
  expo_push_token_updated_at: Date | null;

  

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => WalletTransaction, (tx) => tx.user)
  wallet_transactions: WalletTransaction[];
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

  @ManyToOne(() => Achievement, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "selected_achievement_id" })
  selected_achievement: Achievement | null;

  @ManyToMany(() => Tournament, (tournament) => tournament.winners)
  wonTournaments: Tournament[];

  @OneToMany(() => UserNotification, (n) => n.user)
  notifications: UserNotification[];
}