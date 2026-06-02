import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CarreraActiva, GpsChofer, SolicitudData } from '@/types';

interface CarreraState {
  // Datos que el pasajero ingresó antes de confirmar
  solicitud:    SolicitudData | null;
  // Carrera creada — incluye su estado actual
  carrera:      CarreraActiva | null;
  // Última posición GPS del chofer recibida por WS
  gpsChofer:    GpsChofer | null;
  // Carrera completada esperando calificación
  paraCalificar: CarreraActiva | null;

  setSolicitud:    (s: SolicitudData | null) => void;
  setCarrera:      (c: CarreraActiva | null) => void;
  setGpsChofer:    (g: GpsChofer) => void;
  setParaCalificar:(c: CarreraActiva) => void;
  clear:           () => void;
}

export const useCarreraStore = create<CarreraState>()(
  persist(
    (set) => ({
      solicitud:     null,
      carrera:       null,
      gpsChofer:     null,
      paraCalificar: null,

      setSolicitud:    (s) => set({ solicitud: s }),
      setCarrera:      (c) => set({ carrera: c }),
      setGpsChofer:    (g) => set({ gpsChofer: g }),
      setParaCalificar:(c) => set({ paraCalificar: c, carrera: null }),
      clear: () => set({ solicitud: null, carrera: null, gpsChofer: null, paraCalificar: null }),
    }),
    {
      name: 'cooptaxi-pasajero-carrera',
      partialize: (s) => ({ carrera: s.carrera, paraCalificar: s.paraCalificar }),
    },
  ),
);
