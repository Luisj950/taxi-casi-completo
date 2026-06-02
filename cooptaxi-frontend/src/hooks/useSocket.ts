import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export function useSocket(namespace: '/despacho' | '/seguridad') {
  const ref   = useRef<Socket | null>(null);
  const token = useAuthStore((s) => localStorage.getItem('access_token'));

  useEffect(() => {
    const socket = io(`${WS_URL}${namespace}`, {
      auth:        { token },
      transports:  ['websocket'],
      reconnectionAttempts: 5,
    });
    ref.current = socket;
    socket.on('connect', () => socket.emit('join_central'));
    return () => { socket.disconnect(); ref.current = null; };
  }, [namespace, token]);

  const on = useCallback(<T>(event: string, fn: (d: T) => void) => {
    ref.current?.on(event, fn);
    return () => ref.current?.off(event, fn);
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    ref.current?.emit(event, data);
  }, []);

  return { on, emit };
}
