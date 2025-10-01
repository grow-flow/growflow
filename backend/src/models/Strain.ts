import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PhaseTemplate } from './Phase';

export enum StrainType {
  AUTOFLOWER = 'autoflower',
  PHOTOPERIOD = 'photoperiod'
}

@Entity('strains')
export class Strain {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ length: 4, nullable: true })
  abbreviation?: string;

  @Column({ default: 'photoperiod' })
  type: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  breeder?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}