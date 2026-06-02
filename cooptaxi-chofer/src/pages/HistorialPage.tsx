// cooptaxi-chofer/src/pages/HistorialPage.tsx
// Agregar al router: <Route path="/historial" element={<Private><HistorialPage /></Private>} />
// Agregar al menú del Home: botón "Mi historial" que navega a /historial

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Card, Badge, Spinner } from '@/components/ui';
import { ArrowLeft, Star, Clock, TrendingUp, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

type Periodo = 'hoy' | 'semana' | 'mes';

interface Carrera {
  id:                   string;
  estado:               string;
  origen_descripcion?:  string;
  destino_descripcion?: string;
  duracion_min?:        number;
  calificacion?:        number;
  tarifa?:              number;
  created_at:           string;
}

function estadoBadge(estado: string) {
  if (estado === 'COMPLETADA') return <Badge variant="green">Completada</Badge>;
  if (estado === 'CANCELADA')  return <Badge variant="red">Cancelada</Badge>;
  return <Badge variant="gray">{estado}</Badge>;
}

export default function HistorialPage() {
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const [periodo, setPeriodo] = useState<Periodo>('hoy');

  const desde = {
    hoy:    dayjs().startOf('day').toISOString(),
    semana: dayjs().subtract(7,  'day').toISOString(),
    mes:    dayjs().subtract(30, 'day').toISOString(),
  }[periodo];

  const { data, isLoading } = useQuery({
    queryKey: ['historial-chofer', periodo],
    queryFn:  () => api.get('/despacho/carreras', {
      params: { chofer_id: user?.id, desde, limit: 100 },
    }),
  });

  const carreras     = (data?.data?.data ?? []) as Carrera[];
  const completadas  = carreras.filter((c) => c.estado === 'COMPLETADA');
  const canceladas   = carreras.filter((c) => c.estado === 'CANCELADA');
  const totalMinutos = completadas.reduce((s, c) => s + (c.duracion_min ?? 0), 0);
  const ratingProm   = completadas.filter((c) => c.calificacion).length > 0
    ? (completadas.reduce((s, c) => s + (c.calificacion ?? 0), 0) / completadas.filter((c) => c.calificacion).length).toFixed(1)
    : '—';
  // Estimado de ingresos (tarifa promedio cooperativa ~$2.00 por carrera)
  const ingresosEst  = (completadas.length * 2.0).toFixed(2);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 px-5 pt-6 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')}
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft size={16} className="text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Mi historial</h1>
        </div>

        {/* Selector de período */}
        <div className="flex gap-2">
          {(['hoy','semana','mes'] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                periodo === p
                  ? 'bg-white text-primary-700'
                  : 'bg-white/15 text-white/80'
              }`}
            >
              {p === 'hoy' ? 'Hoy' : p === 'semana' ? '7 días' : '30 días'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-3 grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Completadas', value: completadas.length,  icon: '✓' },
          { label: 'Canceladas',  value: canceladas.length,   icon: '✗' },
          { label: 'Rating prom', value: ratingProm,          icon: '★' },
          { label: 'Est. ingreso', value: `$${ingresosEst}`, icon: '$' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lista de carreras */}
      <div className="flex-1 px-4 overflow-y-auto pb-6 space-y-2">
        {isLoading && (
          <div className="flex justify-center py-12"><Spinner /></div>
        )}

        {!isLoading && carreras.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar size={36} className="mb-3 opacity-40" />
            <p className="text-sm">Sin carreras en este período</p>
          </div>
        )}

        {carreras.map((c) => (
          <Card key={c.id} className="flex items-start gap-3">
            {/* Ícono estado */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              c.estado === 'COMPLETADA' ? 'bg-success-50' : 'bg-gray-100'
            }`}>
              <span className="text-lg">
                {c.estado === 'COMPLETADA' ? '✓' : '✗'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                {estadoBadge(c.estado)}
                <span className="text-[11px] text-gray-400">
                  {dayjs(c.created_at).format('DD/MM HH:mm')}
                </span>
              </div>

              <p className="text-xs text-gray-500 truncate">
                📍 {c.origen_descripcion ?? 'Origen'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                🏁 {c.destino_descripcion ?? 'Destino'}
              </p>

              {c.estado === 'COMPLETADA' && (
                <div className="flex items-center gap-3 mt-1.5">
                  {c.duracion_min && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock size={10} /> {c.duracion_min} min
                    </span>
                  )}
                  {c.calificacion && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-500">
                      <Star size={10} className="fill-amber-400" />
                      {c.calificacion}/5
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
