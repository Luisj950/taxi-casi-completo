import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToOne, OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Vehiculo } from '../../flota/entities/vehiculo.entity';
import { Carrera } from '../../despacho/entities/carrera.entity';
import { Documento } from '../../documentos/entities/documento.entity';
import { Cuota } from '../../finanzas/entities/cuota.entity';
import { Incidente } from '../../seguridad/entities/incidente.entity';

export enum UserRol {
  ADMIN       = 'ADMIN',
  DESPACHADOR = 'DESPACHADOR',
  CHOFER      = 'CHOFER',
  PASAJERO    = 'PASAJERO',
  MECANICO    = 'MECANICO',
}

export enum EstadoChofer {
  DISPONIBLE = 'DISPONIBLE',
  EN_CARRERA = 'EN_CARRERA',
  INACTIVO   = 'INACTIVO',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  nombre: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 10, nullable: true })
  cedula: string;

  @Column({ length: 15, nullable: true })
  telefono: string;

  @Column()
  @Exclude()                    // no exponer en respuestas
  password_hash: string;

  @Column({ type: 'enum', enum: UserRol, default: UserRol.CHOFER })
  rol: UserRol;

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'float', default: 5.0 })
  rating_promedio: number;

  @Column({ default: 0 })
  total_carreras: number;

  // Posición en la cola de despacho (menor = primero)
  // Se gestiona en Redis, pero se persiste aquí para auditoría
  @Column({ default: 0 })
  posicion_cola: number;

  @Column({
    type: 'enum',
    enum: EstadoChofer,
    default: EstadoChofer.INACTIVO,
    nullable: true,
  })
  estado_chofer: EstadoChofer;

  // Token FCM para push notifications
  @Column({ nullable: true })
  fcm_token: string;

  @Column({ nullable: true })
  @Exclude()
  refresh_token_hash: string;

  // ─── Relaciones ───────────────────────────────────────

  @OneToOne(() => Vehiculo, (v) => v.socio, { nullable: true })
  vehiculo: Vehiculo;

  @OneToMany(() => Carrera, (c) => c.chofer)
  carreras_conducidas: Carrera[];

  @OneToMany(() => Carrera, (c) => c.pasajero)
  carreras_solicitadas: Carrera[];

  @OneToMany(() => Documento, (d) => d.user)
  documentos: Documento[];

  @OneToMany(() => Cuota, (c) => c.socio)
  cuotas: Cuota[];

  @OneToMany(() => Incidente, (i) => i.chofer)
  incidentes: Incidente[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
