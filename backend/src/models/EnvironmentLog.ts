import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GrowArea } from './GrowArea';

@Entity()
export class EnvironmentLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  grow_area_id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'float' })
  temperature: number;

  @Column({ type: 'float' })
  humidity: number;

  @Column({ type: 'float' })
  vpd_calculated: number;

  @Column({ type: 'float', nullable: true })
  co2_ppm?: number;

  @Column({ type: 'float', nullable: true })
  light_ppfd?: number;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @ManyToOne(() => GrowArea, growArea => growArea.environment_logs)
  @JoinColumn({ name: 'grow_area_id' })
  grow_area: GrowArea;
}