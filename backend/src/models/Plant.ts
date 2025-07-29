import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Growbox } from './Growbox';
import { WateringLog } from './WateringLog';
import { FeedingLog } from './FeedingLog';
import { ObservationLog } from './ObservationLog';

export enum PlantPhase {
  GERMINATION = 'germination',
  SEEDLING = 'seedling',
  VEGETATION = 'vegetation',
  PRE_FLOWER = 'pre_flower',
  FLOWERING = 'flowering',
  FLUSHING = 'flushing',
  HARVEST = 'harvest',
  DRYING = 'drying',
  CURING = 'curing'
}

@Entity()
export class Plant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  growbox_id: number;

  @Column()
  name: string;

  @Column()
  strain: string;

  @Column({ nullable: true })
  breeder?: string;

  @Column({ nullable: true })
  phenotype?: string;

  @Column()
  germination_date: Date;

  @Column({ nullable: true })
  vegetation_start_date?: Date;

  @Column({ nullable: true })
  flowering_start_date?: Date;

  @Column({ nullable: true })
  harvest_date?: Date;

  @Column({ type: 'varchar', default: PlantPhase.GERMINATION })
  current_phase: PlantPhase;

  @Column({ type: 'simple-json' })
  light_schedule: {
    vegetation: string;
    flowering: string;
  };

  @Column({ type: 'varchar' })
  medium: 'soil' | 'hydro' | 'coco' | 'dwc';

  @Column({ type: 'float' })
  pot_size_liters: number;

  @Column({ type: 'simple-array', default: '' })
  training_methods: string[];

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_mother_plant: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Growbox, growbox => growbox.plants)
  @JoinColumn({ name: 'growbox_id' })
  growbox: Growbox;

  @OneToMany(() => WateringLog, log => log.plant)
  watering_logs: WateringLog[];

  @OneToMany(() => FeedingLog, log => log.plant)
  feeding_logs: FeedingLog[];

  @OneToMany(() => ObservationLog, log => log.plant)
  observation_logs: ObservationLog[];
}