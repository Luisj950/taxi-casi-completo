import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useCarreraStore } from '@/store/carrera.store';
import type { GpsChofer, CarreraActiva } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export function usePasajeroSocket(pasajeroId: string, carreraId?: string) {
  const ref = useRef<Socket | null>(null);
  const { setCarrera, setGpsChofer, setParaCalificar } = useCarreraStore();

  useEffect(() => {
    if (!pasajeroId) return;
    const token  = localStorage.getItem('access_token');
    const socket = io(`${WS_URL}/despacho`, {
      auth:       { token },
      transports: ['websocket'],
      reconnectionAttempts: 10,
    });
    ref.current = socket;

    socket.on('connect', () => {
      socket.emit('join_pasajero', { pasajero_id: pasajeroId });
    });

    // Chofer aceptó la carrera
    socket.on('carrera_confirmada', (data: { carrera_id: string; chofer_id: string }) => {
      // Actualizar estado local — el polling de React Query hará el resto
      console.log('[WS] Carrera confirmada', data);
    });

    // GPS del chofer en tiempo real
    socket.on('gps_chofer', (data: GpsChofer) => {
      if (data.carrera_id === carreraId) setGpsChofer(data);
    });

    // Carrera cancelada
    socket.on('carrera_cancelada', () => {
      setCarrera(null);
    });

    return () => {
      socket.disconnect();
      ref.current = null;
    };
  }, [pasajeroId, carreraId, setCarrera, setGpsChofer]);

  const emit = useCallback((event: string, data?: unknown) => {
    ref.current?.emit(event, data);
  }, []);

  return { emit };
}

// Hook de GPS del dispositivo del pasajero
export function useGPS() {
  const ref = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const wid = navigator.geolocation.watchPosition(
      (pos) => { ref.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, []);

  function getCoords() { return ref.current; }
  return { getCoords };
}
