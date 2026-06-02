export type EstadoCarrera = 'PENDIENTE' | 'ASIGNADA' | 'EN_RUTA' | 'COMPLETADA' | 'CANCELADA';

export interface UserPasajero {
  id:     string;
  nombre: string;
  email:  string;
  rol:    string;
  telefono?: string;
}

export interface SolicitudData {
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
}

export interface CarreraActiva {
  id:                   string;
  estado:               EstadoCarrera;
  origen_descripcion?:  string;
  destino_descripcion?: string;
  origen_lat:           number;
  origen_lng:           number;
  destino_lat:          number;
  destino_lng:          number;
  chofer?: {
    id:              string;
    nombre:          string;
    rating_promedio: number;
    vehiculo?: {
      placa:  string;
      marca:  string;
      modelo: string;
      color?: string;
    };
  };
  tarifa_estimada?: number;
  created_at:       string;
}

export interface GpsChofer {
  chofer_id:  string;
  lat:        number;
  lng:        number;
  carrera_id: string;
}
