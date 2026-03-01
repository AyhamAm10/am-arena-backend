// src/entities/Tournament.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  game_type: string; // polymorphic

  @Column()
  game_ref_id: number; // polymorphic

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  type: string;

  @Column('decimal')
  entry_fee: number;

  @Column('decimal')
  prize_pool: number;

  @Column()
  max_players: number;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @ManyToOne(() => User, (user) => user.created_tournaments)
  created_by: User;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}