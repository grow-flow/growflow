import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Plant } from './Plant';
import { EnvironmentLog } from './EnvironmentLog';

@Entity()
export class GrowArea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'indoor' })
  type: 'indoor' | 'outdoor';

  @Column({ type: 'simple-json' })
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  @Column({ type: 'simple-json' })
  equipment: {
    lights: string[];
    fans: string[];
    humidifier?: string;
    dehumidifier?: string;
    heater?: string;
  };

  @Column({ type: 'simple-json' })
  sensors: {
    temperature: string;
    humidity: string;
    co2?: string;
    light_intensity?: string;
  };

  @Column({ type: 'boolean', default: false })
  automation_enabled: boolean;

  @Column({ type: 'simple-json' })
  target_vpd_by_phase: {
    germination: number;
    seedling: number;
    vegetation: number;
    flowering: number;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Plant, plant => plant.grow_area)
  plants: Plant[];

  @OneToMany(() => EnvironmentLog, log => log.grow_area)
  environment_logs: EnvironmentLog[];
}