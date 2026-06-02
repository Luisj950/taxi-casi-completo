export type UserRol      = 'ADMIN' | 'DESPACHADOR' | 'CHOFER' | 'PASAJERO' | 'MECANICO';
export type EstadoChofer = 'DISPONIBLE' | 'EN_CARRERA' | 'INACTIVO';
export type EstadoCarrera= 'PENDIENTE'  | 'ASIGNADA'   | 'EN_RUTA' | 'COMPLETADA' | 'CANCELADA';
export type TipoDocumento= 'LICENCIA'   | 'MATRICULA'  | 'SPPAT'   | 'RTV';
export type TipoCuota    = 'MENSUAL'    | 'MULTA'      | 'ESPECIAL';

export interface User {
  id:              string;
  nombre:          string;
  email:           string;
  cedula?:         string;
  telefono?:       string;
  rol:             UserRol;
  activo:          boolean;
  rating_promedio: number;
  total_carreras:  number;
  posicion_cola:   number;
  estado_chofer:   EstadoChofer;
  vehiculo?:       Vehiculo;
  documentos?:     Documento[];
  cuotas?:         Cuota[];
  created_at:      string;
}

export interface Vehiculo {
  id:        string;
  socio_id:  string;
  placa:     string;
  marca:     string;
  modelo:    string;
  anio:      number;
  color?:    string;
  activo:    boolean;
  km_actual?: number;
  documentos?: Documento[];
}

export interface Carrera {
  id:                   string;
  pasajero_id:          string;
  chofer_id?:           string;
  chofer?:              Pick<User, 'id' | 'nombre' | 'rating_promedio'>;
  pasajero?:            Pick<User, 'id' | 'nombre' | 'telefono'>;
  estado:               EstadoCarrera;
  origen_lat:           number;
  origen_lng:           number;
  origen_descripcion?:  string;
  destino_lat:          number;
  destino_lng:          number;
  destino_descripcion?: string;
  distancia_km?:        number;
  duracion_min?:        number;
  tarifa?:              number;
  calificacion?:        number;
  comentario?:          string;
  created_at:           string;
}

export interface Documento {
  id:                 string;
  user_id?:           string;
  vehiculo_id?:       string;
  user?:              Pick<User, 'id' | 'nombre'>;
  tipo:               TipoDocumento;
  numero_documento?:  string;
  fecha_vencimiento:  string;
  dias_restantes?:    number;
  alerta_enviada:     boolean;
}

export interface Cuota {
  id:                string;
  socio_id:          string;
  socio?:            Pick<User, 'id' | 'nombre'>;
  tipo:              TipoCuota;
  monto:             number;
  fecha_vencimiento: string;
  pagada:            boolean;
  fecha_pago?:       string;
  descripcion?:      string;
}

export interface ItemCola {
  posicion:   number;
  chofer_id:  string;
  nombre:     string;
  placa:      string;
  estado:     EstadoChofer | 'BLOQUEADO';
  rating:     number;
}

export interface EstadoAltaDemanda {
  modo_alta_demanda:       boolean;
  evento_activo_id:        string | null;
  solicitudes_pendientes:  number;
  conductores_disponibles: number;
  umbral:                  number;
}

export interface AuthResponse {
  access_token:  string;
  refresh_token: string;
  user:          Pick<User, 'id' | 'nombre' | 'email' | 'rol' | 'rating_promedio'>;
}

export interface Paginated<T> {
  data:   T[];
  total:  number;
  page:   number;
}

export interface ReporteFinanciero {
  total_recaudado: number;
  cuotas_cobradas: number;
  multas_cobradas: number;
  socios_en_mora:  number;
}

export interface Mantenimiento {
  id:          string;
  vehiculo_id: string;
  tipo:        string;
  descripcion?: string;
  km_actual?:  number;
  km_proximo?: number;
  costo?:      number;
  fecha?:      string;
  created_at:  string;
}
