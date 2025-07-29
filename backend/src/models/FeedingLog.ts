import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plant } from './Plant';

@Entity()
export class FeedingLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  plant_id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'simple-json' })
  nutrients: Array<{
    name: string;
    amount_ml: number;
    npk_ratio?: string;
  }>;

  @Column({ type: 'float', nullable: true })
  ph_level?: number;

  @Column({ type: 'float', nullable: true })
  ec_ppm?: number;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @ManyToOne(() => Plant, plant => plant.feeding_logs)
  @JoinColumn({ name: 'plant_id' })
  plant: Plant;
}