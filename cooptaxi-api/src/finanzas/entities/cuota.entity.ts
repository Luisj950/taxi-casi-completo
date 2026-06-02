import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TipoCuota {
  MENSUAL   = 'MENSUAL',
  MULTA     = 'MULTA',
  ESPECIAL  = 'ESPECIAL',
}

export enum MetodoPago {
  EFECTIVO   = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
}

@Entity('cuotas')
export class Cuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.cuotas)
  @JoinColumn({ name: 'socio_id' })
  socio: User;

  @Column()
  socio_id: string;

  @Column({ type: 'enum', enum: TipoCuota, default: TipoCuota.MENSUAL })
  tipo: TipoCuota;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  monto: number;

  @Column({ type: 'date' })
  fecha_vencimiento: string;

  @Column({ default: false })
  pagada: boolean;

  @Column({ nullable: true })
  fecha_pago: Date;

  @Column({ type: 'enum', enum: MetodoPago, nullable: true })
  metodo_pago: MetodoPago;

  @Column({ length: 60, nullable: true })
  comprobante: string;

  @Column({ length: 200, nullable: true })
  descripcion: string;

  @CreateDateColumn()
  created_at: Date;
}
