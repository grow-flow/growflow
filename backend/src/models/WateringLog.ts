import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plant } from './Plant';

@Entity()
export class WateringLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  plant_id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'float' })
  amount_ml: number;

  @Column({ type: 'float', nullable: true })
  ph_level?: number;

  @Column({ type: 'float', nullable: true })
  ec_ppm?: number;

  @Column({ type: 'float', nullable: true })
  water_temperature?: number;

  @Column({ type: 'float', nullable: true })
  runoff_ph?: number;

  @Column({ type: 'float', nullable: true })
  runoff_ec?: number;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @ManyToOne(() => Plant, plant => plant.watering_logs)
  @JoinColumn({ name: 'plant_id' })
  plant: Plant;
}