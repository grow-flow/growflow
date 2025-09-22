import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Plant } from './Plant';

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Plant, plant => plant.grow_area)
  plants: Plant[];
}