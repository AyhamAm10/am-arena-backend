import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Tournament } from "./Tournament";

@Entity({ name: "pubg_registration_fields" })
export class PubgRegistrationField {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tournament)
  tournament: Tournament;

  @Column()
  label: string;

  @Column({ type: "enum", enum: ["string","number","boolean","select"] })
  type: "string" | "number" | "boolean" | "select";

  @Column({ type: "text", nullable: true })
  options: string; // لو النوع select

  @Column({ default: true })
  required: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}