import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Carrera } from '../../despacho/entities/carrera.entity';

export enum TipoIncidente {
  PANICO             = 'PANICO',
  PASAJERO_CONFLICTIVO = 'PASAJERO_CONFLICTIVO',
  ZONA_PELIGROSA     = 'ZONA_PELIGROSA',
  ACCIDENTE          = 'ACCIDENTE',
  OTRO               = 'OTRO',
}

@Entity('incidentes')
export class Incidente {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => User, (u) => u.incidentes) @JoinColumn({ name: 'chofer_id' }) chofer: User;
  @Column({ nullable: true }) chofer_id: string;
  @ManyToOne(() => Carrera, { nullable: true }) @JoinColumn({ name: 'carrera_id' }) carrera: Carrera;
  @Column({ nullable: true }) carrera_id: string;
  @Column({ type: 'enum', enum: TipoIncidente }) tipo: TipoIncidente;
  @Column({ type: 'text', nullable: true }) descripcion: string;
  @Column({ type: 'float', nullable: true }) lat: number;
  @Column({ type: 'float', nullable: true }) lng: number;
  @CreateDateColumn() created_at: Date;
}
