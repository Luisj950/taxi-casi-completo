// ── types/index.ts ─────────────────────────────────────────
export type EstadoChofer  = 'DISPONIBLE' | 'EN_CARRERA' | 'INACTIVO';
export type EstadoCarrera = 'PENDIENTE'  | 'ASIGNADA'   | 'EN_RUTA' | 'COMPLETADA' | 'CANCELADA';

export interface UserChofer {
  id:              string;
  nombre:          string;
  email:           string;
  rol:             string;
  rating_promedio: number;
  total_carreras:  number;
  posicion_cola:   number;
  estado_chofer:   EstadoChofer;
  vehiculo?: {
    placa:  string;
    marca:  string;
    modelo: string;
  };
  documentos?: DocumentoResumen[];
  cuotas?:     CuotaResumen[];
}

export interface DocumentoResumen {
  id:                string;
  tipo:              'LICENCIA' | 'MATRICULA' | 'SPPAT' | 'RTV';
  fecha_vencimiento: string;
  dias_restantes:    number;
}

export interface CuotaResumen {
  id:     string;
  monto:  number;
  pagada: boolean;
}

export interface CarreraIncoming {
  carrera_id:  string;
  pasajero_id: string;
  origen: {
    lat:         number;
    lng:         number;
    descripcion: string;
  };
  destino: {
    lat:         number;
    lng:         number;
    descripcion: string;
  };
  timeout_seg: number;
}

export interface CarreraActiva extends CarreraIncoming {
  chofer_id:      string;
  estado:         EstadoCarrera;
  inicio_en_ruta: string;
}
