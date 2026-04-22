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
  image: string;

  @Column({ nullable: true })
  image_public_id: string | null;

  @Column()
  map: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}