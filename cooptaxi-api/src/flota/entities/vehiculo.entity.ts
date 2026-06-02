import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn, OneToMany, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Documento } from '../../documentos/entities/documento.entity';

export enum TipoMantenimiento {
  ACEITE   = 'ACEITE',
  FRENOS   = 'FRENOS',
  LLANTAS  = 'LLANTAS',
  GENERAL  = 'GENERAL',
  OTRO     = 'OTRO',
}

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (u) => u.vehiculo)
  @JoinColumn({ name: 'socio_id' })
  socio: User;

  @Column()
  socio_id: string;

  @Column({ length: 10, unique: true })
  placa: string;

  @Column({ length: 60 })
  marca: string;

  @Column({ length: 60 })
  modelo: string;

  @Column({ type: 'int' })
  anio: number;

  @Column({ length: 30, nullable: true })
  color: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'int', nullable: true })
  km_actual: number;

  @OneToMany(() => Documento, (d) => d.vehiculo)
  documentos: Documento[];

  @CreateDateColumn()
  created_at: Date;
}
