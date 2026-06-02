// ── hooks/useSocket.ts ─────────────────────────────────────
import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { CarreraIncoming } from '@/types';
import { useCarreraStore } from '@/store/carrera.store';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export function useDespachoSocket(choferId: string) {
  const ref = useRef<Socket | null>(null);
  const { setIncoming } = useCarreraStore();

  useEffect(() => {
    if (!choferId) return;
    const token  = localStorage.getItem('access_token');
    const socket = io(`${WS_URL}/despacho`, {
      auth:       { token },
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay:    2000,
    });
    ref.current = socket;

    // Al conectar, registrarse en la cola
    socket.on('connect', () => {
      socket.emit('join_queue', { chofer_id: choferId });
    });

    // Nueva carrera asignada
    socket.on('carrera_incoming', (data: CarreraIncoming) => {
      setIncoming(data);
      // Vibración en móvil si está disponible
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    });

    // Carrera cancelada mientras esperaba respuesta
    socket.on('carrera_cancelada', () => {
      setIncoming(null);
    });

    // Bienvenida por alta demanda
    socket.on('alta_demanda_bienvenida', (data: { mensaje: string; posicion: number }) => {
      console.log('[Alta demanda]', data.mensaje);
    });

    return () => {
      socket.emit('leave_queue');
      socket.disconnect();
      ref.current = null;
    };
  }, [choferId, setIncoming]);

  const emit = useCallback((event: string, data?: unknown) => {
    ref.current?.emit(event, data);
  }, []);

  return { emit, socket: ref };
}


// ── hooks/useGPS.ts ────────────────────────────────────────
import { useState, useEffect } from 'react';

export interface Coords { lat: number; lng: number; accuracy?: number }

export function useGPS(active: boolean) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    if (!active || !navigator.geolocation) {
      setError('GPS no disponible en este dispositivo');
      return;
    }

    const wid = navigator.geolocation.watchPosition(
      (pos) => setCoords({
        lat:      pos.coords.latitude,
        lng:      pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(wid);
  }, [active]);

  return { coords, error };
}
