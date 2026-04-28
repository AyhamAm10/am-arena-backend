// src/entities/Tournament.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { User } from './User';
import { Poll } from './Poll';

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


  @Column('decimal')
  entry_fee: number;

  @Column('decimal')
  prize_pool: number;

  @Column()
  max_players: number;

  @Column({ nullable: true })
  start_date: Date | null;

  @Column({ nullable: true })
  end_date: Date | null;

  @ManyToOne(() => User, (user) => user.created_tournaments)
  created_by: User;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_super: boolean;

  @Column({ type: 'int', default: 0 })
  Xp_condition: number;

  @Column({ nullable: true })
  champion_achievement_id: number | null;

  @Column({ nullable: true })
  audience_achievement_id: number | null;

  @Column({ nullable: true })
  audience_poll_id: number | null;

  @OneToMany(() => Poll, (poll) => poll.tournament)
  polls: Poll[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => User, (user) => user.wonTournaments)
  @JoinTable({
    name: "tournament_winners",
    joinColumn: { name: "tournament_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "user_id", referencedColumnName: "id" },
  })
  winners: User[];

}