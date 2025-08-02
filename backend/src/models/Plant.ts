import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GrowArea } from './GrowArea';
import { PlantPhaseInstance } from './Phase';
import { PlantEvent } from './Event';

// Legacy enum removed - now using dynamic phase system

@Entity()
export class Plant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  grow_area_id: number;

  @Column()
  name: string;

  @Column()
  strain: string;

  @Column({ nullable: true })
  breeder?: string;

  @Column({ nullable: true })
  phenotype?: string;

  @Column({ type: 'simple-json' })
  phases: PlantPhaseInstance[];

  @Column({ nullable: true })
  current_phase_id?: string;

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

  @Column({ type: 'simple-json', default: '[]' })
  events: PlantEvent[];

  @ManyToOne(() => GrowArea, growArea => growArea.plants)
  @JoinColumn({ name: 'grow_area_id' })
  grow_area: GrowArea;
}