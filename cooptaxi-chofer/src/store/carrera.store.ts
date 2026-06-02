import { create } from 'zustand';
import type { CarreraIncoming, EstadoCarrera } from '@/types';

interface CarreraState {
  // Carrera que acaba de llegar — esperando respuesta del chofer
  incoming:    CarreraIncoming | null;
  // Carrera activa en ruta
  activa:      (CarreraIncoming & { estado: EstadoCarrera }) | null;
  // Carrera recién completada — para mostrar calificación recibida
  completada:  { carrera_id: string; duracion_min: number; calificacion_recibida?: number } | null;

  setIncoming:   (c: CarreraIncoming | null) => void;
  setActiva:     (c: CarreraState['activa']) => void;
  setCompletada: (c: CarreraState['completada']) => void;
  clear:         () => void;
}

export const useCarreraStore = create<CarreraState>()((set) => ({
  incoming:   null,
  activa:     null,
  completada: null,

  setIncoming:   (c) => set({ incoming: c }),
  setActiva:     (c) => set({ activa: c, incoming: null }),
  setCompletada: (c) => set({ completada: c, activa: null }),
  clear:         ()  => set({ incoming: null, activa: null, completada: null }),
}));
