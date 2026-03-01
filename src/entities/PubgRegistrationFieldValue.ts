import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { PubgRegistration } from "./PubgRegistration";
import { PubgRegistrationField } from "./PubgRegistrationField";

@Entity({ name: "pubg_registration_field_values" })
export class PubgRegistrationFieldValue {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PubgRegistration)
  registration: PubgRegistration;

  @ManyToOne(() => PubgRegistrationField)
  field: PubgRegistrationField;

  @Column()
  value: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}