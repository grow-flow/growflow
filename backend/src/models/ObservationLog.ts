import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plant } from './Plant';

@Entity()
export class ObservationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  plant_id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'varchar' })
  observation_type: 'health' | 'training' | 'deficiency' | 'pest' | 'general';

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  severity?: 'low' | 'medium' | 'high';

  @Column({ type: 'simple-array', default: '' })
  photos?: string[];

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @ManyToOne(() => Plant, plant => plant.observation_logs)
  @JoinColumn({ name: 'plant_id' })
  plant: Plant;
}