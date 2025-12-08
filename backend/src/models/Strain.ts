import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum StrainType {
  AUTOFLOWER = 'autoflower',
  PHOTOPERIOD = 'photoperiod'
}

@Entity('strains')
export class Strain {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ length: 4, nullable: true })
  abbreviation?: string;

  @Column({
    type: 'varchar',
    default: 'photoperiod'
  })
  type: StrainType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  breeder?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}