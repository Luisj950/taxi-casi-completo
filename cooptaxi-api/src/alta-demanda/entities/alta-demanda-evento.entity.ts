import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn,
} from 'typeorm';

export enum EstadoAltaDemanda {
  ACTIVO   = 'ACTIVO',
  RESUELTO = 'RESUELTO',
}

@Entity('alta_demanda_eventos')
export class AltaDemandaEvento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Cuántas solicitudes pendientes había cuando se activó
  @Column({ type: 'int' })
  solicitudes_pendientes: number;

  // Cuántos conductores inactivos fueron notificados
  @Column({ type: 'int', default: 0 })
  conductores_notificados: number;

  // Cuántos respondieron y se conectaron
  @Column({ type: 'int', default: 0 })
  conductores_respondieron: number;

  @Column({ type: 'enum', enum: EstadoAltaDemanda, default: EstadoAltaDemanda.ACTIVO })
  estado: EstadoAltaDemanda;

  // Cuándo se resolvió (cola volvió a normal)
  @Column({ nullable: true })
  resuelto_en: Date;

  @CreateDateColumn()
  created_at: Date;
}
