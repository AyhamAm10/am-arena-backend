// src/entities/PubgGame.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PubgType {
  SOLO = 'solo',
  DUO = 'duo',
  SQUAD = 'squad',
}

@Entity('pubg_game')
export class PubgGame {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: PubgType })
  type: PubgType;

  @Column()
  map: string;

  @Column()
  max_players: number;

  @Column('decimal')
  entry_fee: number;

  @Column('decimal')
  prize_pool: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}