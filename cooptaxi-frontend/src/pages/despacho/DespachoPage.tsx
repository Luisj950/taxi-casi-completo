import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { despachoApi, altaDemandaApi } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { Card, Badge, Button, SectionTitle, Spinner } from '@/components/ui';
import { MapPin, Zap, Radio, AlertTriangle, Map } from 'lucide-react';
import { lazy, Suspense } from 'react';
const MapaDespacho = lazy(() => import('@/components/despacho/MapaDespacho'));
import dayjs from 'dayjs';
import type { Carrera, ItemCola, EstadoAltaDemanda } from '@/types';

function colaBadge(estado: ItemCola['estado']) {
  if (estado === 'DISPONIBLE') return <Badge variant="green">Disponible</Badge>;
  if (estado === 'EN_CARRERA') return <Badge variant="blue">En carrera</Badge>;
  if (estado === 'BLOQUEADO')  return <Badge variant="red">Bloqueado</Badge>;
  return <Badge variant="gray">Inactivo</Badge>;
}

export default function DespachoPage() {
  const qc = useQueryClient();
  const { on, emit } = useSocket('/despacho');
  const [panico, setPanico] = useState<{ nombre?: string; lat: number; lng: number } | null>(null);

  const { data: colaRes,      isLoading: loadCola } = useQuery({
    queryKey: ['cola'],
    queryFn:  () => despachoApi.cola(),
    refetchInterval: 20_000,
  });
  const { data: pendRes,      isLoading: loadPend } = useQuery({
    queryKey: ['pendientes'],
    queryFn:  () => despachoApi.carreras({ estado: 'PENDIENTE', limit: 10 }),
    refetchInterval: 10_000,
  });
  const { data: altaRes } = useQuery({
    queryKey: ['alta-demanda'],
    queryFn:  () => altaDemandaApi.estado(),
    refetchInterval: 15_000,
  });

  const activarAlta = useMutation({
    mutationFn: () => altaDemandaApi.activar(),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['alta-demanda'] }),
  });

  // WebSocket en tiempo real
  useEffect(() => {
    emit('join_central');
    const off1 = on('cola_actualizada', () => {
      qc.invalidateQueries({ queryKey: ['cola'] });
      qc.invalidateQueries({ queryKey: ['pendientes'] });
    });
    const off2 = on<{ chofer_id: string; lat: number; lng: number }>('panic_alert', (d) => {
      const cola = (colaRes?.data?.cola ?? []) as ItemCola[];
      setPanico({ nombre: cola.find((c) => c.chofer_id === d.chofer_id)?.nombre, lat: d.lat, lng: d.lng });
    });
    return () => { off1(); off2(); };
  }, [on, emit, qc, colaRes]);

  const cola      = (colaRes?.data?.cola  ?? []) as ItemCola[];
  const pendientes = (pendRes?.data?.data  ?? []) as Carrera[];
  const alta       = altaRes?.data as EstadoAltaDemanda | undefined;

  const disponibles = cola.filter((c) => c.estado === 'DISPONIBLE').length;
  const enCarrera   = cola.filter((c) => c.estado === 'EN_CARRERA').length;
  const bloqueados  = cola.filter((c) => c.estado === 'BLOQUEADO').length;

  return (
    <div className="p-6 space-y-5 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Central de despacho</h1>
            <p className="text-xs text-gray-400">{dayjs().format('HH:mm')} — Turno activo</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success-400 inline-block" />
            {disponibles} disponibles
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            {enCarrera} en carrera
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-danger-300 inline-block" />
            {bloqueados} bloqueados
          </span>
          {!alta?.modo_alta_demanda && (
            <Button size="xs" variant="secondary" onClick={() => activarAlta.mutate()} loading={activarAlta.isPending}>
              <Zap size={11} /> Alta demanda
            </Button>
          )}
        </div>
      </div>

      {/* Alerta de pánico */}
      {panico && (
        <div className="flex items-center gap-3 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3">
          <div className="w-2.5 h-2.5 rounded-full bg-danger-400 pulse-dot flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-danger-800">
              🚨 Alerta de pánico — {panico.nombre ?? 'Chofer'}
            </p>
            <p className="text-xs text-danger-600 font-mono">
              {panico.lat.toFixed(5)}, {panico.lng.toFixed(5)}
            </p>
          </div>
          <Button size="sm" variant="danger" onClick={() => setPanico(null)}>Atendido</Button>
        </div>
      )}

      {/* Banner alta demanda */}
      {alta?.modo_alta_demanda && (
        <div className="flex items-center gap-3 bg-warn-50 border border-warn-200 rounded-xl px-4 py-3">
          <Zap size={16} className="text-warn-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-warn-800">Modo alta demanda activo</p>
            <p className="text-xs text-warn-600">
              {alta.solicitudes_pendientes} solicitudes pendientes · {alta.conductores_disponibles} conductores disponibles
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Solicitudes pendientes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle>Solicitudes en espera</SectionTitle>
            <Badge variant={pendientes.length > 0 ? 'amber' : 'gray'}>{pendientes.length}</Badge>
          </div>

          {loadPend && <div className="flex justify-center py-8"><Spinner /></div>}

          {!loadPend && pendientes.length === 0 && (
            <div className="bg-gray-50 rounded-xl py-10 flex flex-col items-center text-gray-400">
              <Radio size={24} className="mb-2 opacity-50" />
              <p className="text-sm">Sin solicitudes pendientes</p>
            </div>
          )}

          {pendientes.map((c, i) => (
            <Card
              key={c.id}
              className={i === 0 ? 'border-primary-200 shadow-primary-50 shadow-md' : ''}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {c.pasajero?.nombre ?? 'Pasajero'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Hace {dayjs().diff(dayjs(c.created_at), 'minute')} min
                  </p>
                </div>
                {i === 0
                  ? <Badge variant="purple">Siguiente a despachar</Badge>
                  : <Badge variant="gray">#{i + 1} en fila</Badge>}
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <MapPin size={11} className="text-primary-400 flex-shrink-0 mt-0.5" />
                  <span>{c.origen_descripcion ?? `${c.origen_lat.toFixed(4)}, ${c.origen_lng.toFixed(4)}`}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <MapPin size={11} className="text-success-500 flex-shrink-0 mt-0.5" />
                  <span>{c.destino_descripcion ?? `${c.destino_lat.toFixed(4)}, ${c.destino_lng.toFixed(4)}`}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">Asignar siguiente</Button>
                <Button size="sm" variant="ghost">Mapa</Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Cola */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Cola de choferes</SectionTitle>
          </div>
          {loadCola && <div className="flex justify-center py-8"><Spinner /></div>}
          <Card padding={false}>
            <table className="table-base">
              <thead>
                <tr>
                  <th className="pl-4 w-10">#</th>
                  <th>Chofer</th>
                  <th>Placa</th>
                  <th>★</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cola.length === 0 && !loadCola && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8 text-sm">
                      Sin choferes en cola
                    </td>
                  </tr>
                )}
                {cola.map((item) => (
                  <tr key={item.chofer_id} className={item.estado === 'BLOQUEADO' ? 'opacity-40' : ''}>
                    <td className="pl-4 font-mono text-xs text-gray-400">
                      {item.estado === 'BLOQUEADO' ? '—' : item.posicion}
                    </td>
                    <td className="font-medium text-gray-800">{item.nombre}</td>
                    <td className="font-mono text-xs">{item.placa}</td>
                    <td className="text-xs">
                      <span className="text-amber-400">★</span> {item.rating.toFixed(1)}
                    </td>
                    <td>{colaBadge(item.estado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      {/* Mapa GPS en tiempo real */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Map size={14} className="text-gray-400" />
          <SectionTitle>Posiciones GPS en tiempo real</SectionTitle>
        </div>
        <Suspense fallback={<div className="h-80 bg-gray-50 rounded-xl flex items-center justify-center"><Spinner /></div>}>
          <MapaDespacho />
        </Suspense>
      </section>
    </div>
  );
}
