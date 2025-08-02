import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PhaseTemplate } from './Phase';

export enum StrainType {
  INDICA = 'indica',
  SATIVA = 'sativa', 
  HYBRID = 'hybrid',
  AUTOFLOWERING = 'autoflowering',
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

  @Column({ default: false })
  is_autoflower: boolean;

  @Column({ type: 'int' })
  flowering_time_min: number;

  @Column({ type: 'int' })
  flowering_time_max: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  breeder?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  thc_content?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cbd_content?: number;

  @Column({ 
    type: 'json',
    default: () => "'[]'"
  })
  phase_templates: PhaseTemplate[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}