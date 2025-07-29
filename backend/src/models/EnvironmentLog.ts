import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Growbox } from './Growbox';

@Entity()
export class EnvironmentLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  growbox_id: number;

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

  @ManyToOne(() => Growbox, growbox => growbox.environment_logs)
  @JoinColumn({ name: 'growbox_id' })
  growbox: Growbox;
}