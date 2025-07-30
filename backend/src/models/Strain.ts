import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum StrainType {
  INDICA = 'indica',
  SATIVA = 'sativa', 
  HYBRID = 'hybrid',
  AUTOFLOWERING = 'autoflowering'
}

@Entity('strains')
export class Strain {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: 'hybrid' })
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

  @Column({ type: 'json' })
  phase_durations: {
    germination: number;
    seedling: number;
    vegetation: number;
    pre_flower: number;
    flowering: number;
    flushing: number;
    drying: number;
    curing: number;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}