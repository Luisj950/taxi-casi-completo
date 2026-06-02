// cooptaxi-pasajero/src/pages/HistorialPage.tsx
// Agregar al router: <Route path="/historial" element={<Private><HistorialPage /></Private>} />
// Agregar al Home: botón "Mis viajes" en la parte inferior

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Card, Button, Spinner } from '@/components/ui';
import { ArrowLeft, MapPin, Star, Clock, Download, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

interface Carrera {
  id:                   string;
  estado:               string;
  origen_descripcion?:  string;
  destino_descripcion?: string;
  duracion_min?:        number;
  distancia_km?:        number;
  calificacion?:        number;
  tarifa?:              number;
  chofer?: {
    nombre:          string;
    rating_promedio: number;
    vehiculo?: { placa: string; marca: string; modelo: string };
  };
  created_at: string;
}

// Genera un comprobante en texto para compartir
function generarComprobante(c: Carrera): string {
  return `
==============================
    CoopTaxi — Comprobante
==============================
Código:   #${c.id.slice(-8).toUpperCase()}
Fecha:    ${dayjs(c.created_at).format('DD/MM/YYYY HH:mm')}
------------------------------
Origen:   ${c.origen_descripcion ?? '—'}
Destino:  ${c.destino_descripcion ?? '—'}
Duración: ${c.duracion_min ?? '—'} min
------------------------------
Conductor: ${c.chofer?.nombre ?? '—'}
Placa:     ${c.chofer?.vehiculo?.placa ?? '—'}
------------------------------
Estado:   ${c.estado}
==============================
`.trim();
}

function compartirComprobante(c: Carrera) {
  const texto = generarComprobante(c);
  if (navigator.share) {
    navigator.share({ title: 'Comprobante CoopTaxi', text: texto });
  } else {
    // Fallback: copiar al portapapeles
    navigator.clipboard.writeText(texto).then(() => {
      alert('Comprobante copiado al portapapeles');
    });
  }
}

export default function HistorialPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [expandido, setExpandido] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['historial-pasajero'],
    queryFn:  () => api.get('/despacho/carreras', {
      params: { pasajero_id: user?.id, limit: 50, estado: 'COMPLETADA' },
    }),
  });

  const carreras = (data?.data?.data ?? []) as Carrera[];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-brand-600 px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')}
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft size={16} className="text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Mis viajes</h1>
            <p className="text-white/60 text-xs">{carreras.length} viajes completados</p>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-3 pb-8">
        {isLoading && (
          <div className="flex justify-center py-12"><Spinner /></div>
        )}

        {!isLoading && carreras.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Calendar size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Aún no tienes viajes</p>
            <p className="text-xs mt-1">Solicita tu primer taxi</p>
            <Button
              size="sm" variant="brand"
              className="mt-4"
              onClick={() => navigate('/home')}
            >
              Pedir un taxi
            </Button>
          </div>
        )}

        {carreras.map((c) => {
          const abierto = expandido === c.id;
          return (
            <Card key={c.id} className="overflow-hidden">
              {/* Fila principal */}
              <button
                className="w-full text-left"
                onClick={() => setExpandido(abierto ? null : c.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 text-xl">
                    🚕
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">
                        {dayjs(c.created_at).format('DD MMM YYYY')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dayjs(c.created_at).format('HH:mm')}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {c.origen_descripcion ?? '—'} → {c.destino_descripcion ?? '—'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
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
                  </div>
                  <span className="text-gray-300 text-xs mt-1">
                    {abierto ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {/* Detalle expandido */}
              {abierto && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="text-primary-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500">{c.origen_descripcion ?? '—'}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="text-brand-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500">{c.destino_descripcion ?? '—'}</p>
                  </div>

                  {c.chofer && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                      <span className="text-2xl">👨‍✈️</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{c.chofer.nombre}</p>
                        <p className="text-[11px] text-gray-400">
                          {c.chofer.vehiculo?.placa} · {c.chofer.vehiculo?.marca} {c.chofer.vehiculo?.modelo}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1 text-[11px] font-mono text-gray-300 justify-between">
                    <span>#{c.id.slice(-8).toUpperCase()}</span>
                    <span>{c.estado}</span>
                  </div>

                  <Button
                    fullWidth size="sm" variant="secondary"
                    onClick={() => compartirComprobante(c)}
                  >
                    <Download size={13} /> Compartir comprobante
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
