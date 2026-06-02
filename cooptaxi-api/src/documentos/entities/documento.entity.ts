import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehiculo } from '../../flota/entities/vehiculo.entity';

export enum TipoDocumento {
  LICENCIA  = 'LICENCIA',
  MATRICULA = 'MATRICULA',
  SPPAT     = 'SPPAT',
  RTV       = 'RTV',
}

@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.documentos, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  user_id: string;

  @ManyToOne(() => Vehiculo, { nullable: true })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @Column({ nullable: true })
  vehiculo_id: string;

  @Column({ type: 'enum', enum: TipoDocumento })
  tipo: TipoDocumento;

  @Column({ length: 80, nullable: true })
  numero_documento: string;

  @Column({ type: 'date' })
  fecha_vencimiento: string;

  @Column({ default: false })
  alerta_enviada: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
