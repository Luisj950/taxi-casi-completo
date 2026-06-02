import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EstadoCarrera {
  PENDIENTE  = 'PENDIENTE',
  ASIGNADA   = 'ASIGNADA',
  EN_RUTA    = 'EN_RUTA',
  COMPLETADA = 'COMPLETADA',
  CANCELADA  = 'CANCELADA',
}

@Entity('carreras')
export class Carrera {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.carreras_solicitadas)
  @JoinColumn({ name: 'pasajero_id' })
  pasajero: User;

  @Column({ nullable: true })
  pasajero_id: string;

  @ManyToOne(() => User, (u) => u.carreras_conducidas, { nullable: true })
  @JoinColumn({ name: 'chofer_id' })
  chofer: User;

  @Column({ nullable: true })
  chofer_id: string;

  @Column({ type: 'enum', enum: EstadoCarrera, default: EstadoCarrera.PENDIENTE })
  estado: EstadoCarrera;

  // Origen
  @Column({ type: 'float' })
  origen_lat: number;

  @Column({ type: 'float' })
  origen_lng: number;

  @Column({ length: 200, nullable: true })
  origen_descripcion: string;

  // Destino
  @Column({ type: 'float' })
  destino_lat: number;

  @Column({ type: 'float' })
  destino_lng: number;

  @Column({ length: 200, nullable: true })
  destino_descripcion: string;

  @Column({ type: 'float', nullable: true })
  distancia_km: number;

  @Column({ type: 'int', nullable: true })
  duracion_min: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  tarifa: number;

  // Calificación del chofer por el pasajero (1-5)
  @Column({ type: 'int', nullable: true })
  calificacion: number;

  @Column({ length: 300, nullable: true })
  comentario: string;

  @Column({ nullable: true })
  inicio_en_ruta: Date;

  @Column({ nullable: true })
  fin_carrera: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
