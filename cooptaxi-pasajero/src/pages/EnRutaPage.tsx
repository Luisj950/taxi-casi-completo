import { useEffect, Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCarreraStore } from '@/store/carrera.store';
import { useAuthStore } from '@/store/auth.store';
import { usePasajeroSocket } from '@/hooks/useSocket';
import { despachoApi } from '@/lib/api';
import { ChoferCard, Card, Spinner } from '@/components/ui';
import { MapPin, X } from 'lucide-react';
import type { CarreraActiva } from '@/types';

// Carga diferida del mapa para no bloquear el render inicial
const MapaLeaflet = lazy(() => import('@/components/MapaLeaflet'));

export default function EnRutaPage() {
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const { carrera, gpsChofer, setParaCalificar, clear } = useCarreraStore();
  const [cancelando, setCancelando] = useState(false);

  async function handleCancelar() {
    if (!carrera) return;
    setCancelando(true);
    try { await despachoApi.cancelar(carrera.id); } catch {}
    clear();
    navigate('/home', { replace: true });
  }

  usePasajeroSocket(user?.id ?? '', carrera?.id);

  useEffect(() => {
    if (!carrera) { navigate('/home', { replace: true }); return; }
  }, [carrera, navigate]);

  const { data } = useQuery({
    queryKey:        ['carrera-ruta', carrera?.id],
    queryFn:         () => despachoApi.miCarrera(carrera!.id),
    enabled:         !!carrera?.id,
    refetchInterval: 6_000,
  });

  useEffect(() => {
    const actual = data?.data as CarreraActiva | undefined;
    if (!actual) return;
    if (actual.estado === 'COMPLETADA') {
      setParaCalificar(actual);
      navigate('/calificar', { replace: true });
    }
    if (actual.estado === 'CANCELADA') {
      clear();
      navigate('/home', { replace: true });
    }
  }, [data, setParaCalificar, clear, navigate]);

  if (!carrera) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-brand-600 px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span className="text-white font-semibold text-sm">Tu taxi está en camino</span>
        </div>
        {gpsChofer && (
          <p className="text-white/60 text-xs mt-1 font-mono">
            GPS chofer: {gpsChofer.lat.toFixed(4)}, {gpsChofer.lng.toFixed(4)}
          </p>
        )}
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">

        {/* Mapa Leaflet real */}
        <Suspense fallback={
          <div className="w-full h-52 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Spinner />
          </div>
        }>
          <MapaLeaflet
            choferLat={gpsChofer?.lat}
            choferLng={gpsChofer?.lng}
            origenLat={carrera.origen_lat}
            origenLng={carrera.origen_lng}
            destinoLat={carrera.destino_lat}
            destinoLng={carrera.destino_lng}
          />
        </Suspense>

        {/* Info del chofer */}
        {carrera.chofer && (
          <ChoferCard
            nombre={carrera.chofer.nombre}
            rating={carrera.chofer.rating_promedio}
            placa={carrera.chofer.vehiculo?.placa ?? '—'}
            vehiculo={`${carrera.chofer.vehiculo?.marca ?? ''} ${carrera.chofer.vehiculo?.modelo ?? ''} ${carrera.chofer.vehiculo?.color ?? ''}`}
          />
        )}

        {/* Ruta */}
        <Card>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-3">Tu viaje</p>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <MapPin size={12} className="text-primary-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Desde</p>
              <p className="text-sm font-medium text-gray-800">{carrera.origen_descripcion ?? 'Origen'}</p>
            </div>
          </div>
          <div className="border-l-2 border-dashed border-gray-200 ml-3 h-4 mb-3" />
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <MapPin size={12} className="text-brand-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Hasta</p>
              <p className="text-sm font-medium text-gray-800">{carrera.destino_descripcion ?? 'Destino'}</p>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3">
          <span className="text-sm text-brand-700 font-medium">Tarifa estimada</span>
          <span className="text-sm font-bold text-brand-700">$1.50 – $3.00</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs font-mono text-gray-300">
            #{carrera.id.slice(-8).toUpperCase()}
          </p>
          <button
            onClick={handleCancelar}
            disabled={cancelando}
            className="flex items-center gap-1.5 text-xs text-danger-500 font-medium bg-danger-50 px-3 py-1.5 rounded-xl active:bg-danger-100 disabled:opacity-50"
          >
            <X size={13} /> {cancelando ? 'Cancelando...' : 'Cancelar viaje'}
          </button>
        </div>
      </div>
    </div>
  );
}
