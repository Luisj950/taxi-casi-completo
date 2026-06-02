import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Vehiculo, TipoMantenimiento } from './vehiculo.entity';

@Entity('mantenimientos')
export class Mantenimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vehiculo)
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @Column()
  vehiculo_id: string;

  @Column({ type: 'enum', enum: TipoMantenimiento })
  tipo: TipoMantenimiento;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'int', nullable: true })
  km_actual: number;

  @Column({ type: 'int', nullable: true })
  km_proximo: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  costo: number;

  @Column({ type: 'date', nullable: true })
  fecha: string;

  @CreateDateColumn()
  created_at: Date;
}
