import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { altaDemandaApi } from '@/lib/api';
import { Card, Badge, Button, StatCard, SectionTitle, EmptyState, Spinner } from '@/components/ui';
import { Zap } from 'lucide-react';
import dayjs from 'dayjs';
import type { EstadoAltaDemanda } from '@/types';

interface Evento {
  id: string;
  solicitudes_pendientes: number;
  conductores_notificados: number;
  conductores_respondieron: number;
  estado: 'ACTIVO' | 'RESUELTO';
  resuelto_en?: string;
  created_at: string;
}

export default function AltaDemandaPage() {
  const qc = useQueryClient();

  const { data: estadoRes, isLoading: loadEstado } = useQuery({
    queryKey: ['alta-demanda'],
    queryFn:  () => altaDemandaApi.estado(),
    refetchInterval: 10_000,
  });

  const { data: historialRes, isLoading: loadHist } = useQuery({
    queryKey: ['alta-demanda-hist'],
    queryFn:  () => altaDemandaApi.historial(),
  });

  const activar = useMutation({
    mutationFn: () => altaDemandaApi.activar(),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['alta-demanda'] });
      qc.invalidateQueries({ queryKey: ['alta-demanda-hist'] });
    },
  });

  const estado   = estadoRes?.data   as EstadoAltaDemanda | undefined;
  const eventos  = (historialRes?.data?.data ?? []) as Evento[];
  const totalEv  = historialRes?.data?.total ?? 0;

  // Métricas del historial
  const totalNotif     = eventos.reduce((s, e) => s + e.conductores_notificados, 0);
  const totalResp      = eventos.reduce((s, e) => s + e.conductores_respondieron, 0);
  const tasaRespuesta  = totalNotif > 0 ? Math.round((totalResp / totalNotif) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-warn-600" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Alta demanda</h1>
            <p className="text-xs text-gray-400">
              Se activa automáticamente cuando hay {estado?.umbral ?? 5}+ solicitudes sin chofer disponible
            </p>
          </div>
        </div>
        {!estado?.modo_alta_demanda && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => activar.mutate()}
            loading={activar.isPending}
          >
            <Zap size={13} /> Activar manualmente
          </Button>
        )}
      </div>

      {/* Estado actual */}
      {loadEstado
        ? <div className="flex justify-center py-6"><Spinner /></div>
        : estado && (
          <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${
            estado.modo_alta_demanda
              ? 'bg-warn-50 border-warn-200'
              : 'bg-gray-50 border-gray-100'
          }`}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              estado.modo_alta_demanda ? 'bg-warn-400 pulse-dot' : 'bg-gray-300'
            }`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${estado.modo_alta_demanda ? 'text-warn-800' : 'text-gray-500'}`}>
                {estado.modo_alta_demanda ? 'Modo alta demanda ACTIVO' : 'Sistema en operación normal'}
              </p>
              <p className={`text-xs mt-0.5 ${estado.modo_alta_demanda ? 'text-warn-600' : 'text-gray-400'}`}>
                {estado.solicitudes_pendientes} solicitudes pendientes · {estado.conductores_disponibles} conductores disponibles · umbral: {estado.umbral}
              </p>
            </div>
            {estado.modo_alta_demanda && estado.evento_activo_id && (
              <Badge variant="amber">Evento #{estado.evento_activo_id.slice(-6).toUpperCase()}</Badge>
            )}
          </div>
        )
      }

      {/* Métricas del historial */}
      <section>
        <SectionTitle>Resumen histórico</SectionTitle>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Eventos totales"      value={totalEv} />
          <StatCard label="Conductores notif."   value={totalNotif} />
          <StatCard label="Conductores respondieron" value={totalResp} subVariant="up" />
          <StatCard
            label="Tasa de respuesta"
            value={`${tasaRespuesta}%`}
            subVariant={tasaRespuesta >= 50 ? 'up' : 'warn'}
            sub={tasaRespuesta >= 50 ? 'Buen rendimiento' : 'Mejorable'}
          />
        </div>
      </section>

      {/* Historial de eventos */}
      <section>
        <SectionTitle>Historial de eventos</SectionTitle>
        <Card padding={false}>
          {loadHist && <div className="flex justify-center py-10"><Spinner /></div>}
          {!loadHist && eventos.length === 0 && (
            <EmptyState message="Sin eventos de alta demanda registrados" icon="⚡" />
          )}
          {!loadHist && eventos.length > 0 && (
            <table className="table-base">
              <thead>
                <tr>
                  <th className="pl-4">Fecha</th>
                  <th>Solicitudes</th>
                  <th>Notificados</th>
                  <th>Respondieron</th>
                  <th>Duración</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((e) => {
                  const durMin = e.resuelto_en
                    ? dayjs(e.resuelto_en).diff(dayjs(e.created_at), 'minute')
                    : null;
                  return (
                    <tr key={e.id}>
                      <td className="pl-4 text-gray-500">
                        {dayjs(e.created_at).format('DD/MM/YY HH:mm')}
                      </td>
                      <td>
                        <span className="font-semibold text-gray-800">{e.solicitudes_pendientes}</span>
                      </td>
                      <td>{e.conductores_notificados}</td>
                      <td>
                        <span className={e.conductores_respondieron > 0 ? 'text-success-600 font-medium' : 'text-gray-400'}>
                          {e.conductores_respondieron}
                        </span>
                      </td>
                      <td className="text-gray-400">
                        {durMin !== null ? `${durMin} min` : '—'}
                      </td>
                      <td>
                        {e.estado === 'ACTIVO'
                          ? <Badge variant="amber">Activo</Badge>
                          : <Badge variant="green">Resuelto</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </div>
  );
}
