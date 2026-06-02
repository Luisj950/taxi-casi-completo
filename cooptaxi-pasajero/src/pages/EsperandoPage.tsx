import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCarreraStore } from '@/store/carrera.store';
import { useAuthStore } from '@/store/auth.store';
import { usePasajeroSocket } from '@/hooks/useSocket';
import { despachoApi } from '@/lib/api';
import { Button, SearchingDots, ChoferCard } from '@/components/ui';
import { MapPin, X } from 'lucide-react';
import type { CarreraActiva } from '@/types';

export default function EsperandoPage() {
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const { carrera, setCarrera, clear } = useCarreraStore();

  usePasajeroSocket(user?.id ?? '', carrera?.id);

  // Polling cada 5 segundos para detectar cuando el chofer acepta
  const { data } = useQuery({
    queryKey:        ['carrera', carrera?.id],
    queryFn:         () => despachoApi.miCarrera(carrera!.id),
    enabled:         !!carrera?.id,
    refetchInterval: 5_000,
  });

  useEffect(() => {
    if (!carrera) { navigate('/home', { replace: true }); return; }
  }, [carrera, navigate]);

  // Detectar cambio de estado
  useEffect(() => {
    const actualizada = data?.data as CarreraActiva | undefined;
    if (!actualizada) return;

    if (actualizada.estado === 'EN_RUTA' || actualizada.estado === 'ASIGNADA') {
      setCarrera(actualizada);
      navigate('/en-ruta', { replace: true });
    }
    if (actualizada.estado === 'CANCELADA') {
      clear();
      navigate('/home', { replace: true });
    }
  }, [data, setCarrera, clear, navigate]);

  async function handleCancelar() {
    if (!carrera) return;
    try { await despachoApi.cancelar(carrera.id); } catch {}
    clear();
    navigate('/home', { replace: true });
  }

  if (!carrera) return null;

  const tieneChofer = !!carrera.chofer;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Zona de animación */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {!tieneChofer ? (
          <>
            {/* Animación de búsqueda */}
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 rounded-full bg-brand-50 animate-ping opacity-30" />
              <div className="absolute inset-4 rounded-full bg-brand-100 animate-ping opacity-40" style={{ animationDelay: '0.3s' }} />
              <div className="w-32 h-32 rounded-full bg-brand-50 flex items-center justify-center">
                <span className="text-5xl">🚕</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Buscando tu taxi</h2>
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <SearchingDots />
              <span className="text-sm">Conectando con la central</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Espera un momento, estamos asignando el conductor más cercano
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center mb-4 text-4xl">
              👨‍✈️
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">¡Chofer asignado!</h2>
            <p className="text-sm text-gray-400 mb-6">Tu taxi está en camino</p>
            {carrera.chofer && (
              <div className="w-full">
                <ChoferCard
                  nombre={carrera.chofer.nombre}
                  rating={carrera.chofer.rating_promedio}
                  placa={carrera.chofer.vehiculo?.placa ?? '—'}
                  vehiculo={`${carrera.chofer.vehiculo?.marca ?? ''} ${carrera.chofer.vehiculo?.modelo ?? ''}`}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Detalle ruta */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-primary-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 truncate">{carrera.origen_descripcion ?? 'Origen'}</p>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-brand-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 truncate">{carrera.destino_descripcion ?? 'Destino'}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs font-mono text-gray-300">
            #{carrera.id.slice(-8).toUpperCase()}
          </p>
          <button
            onClick={handleCancelar}
            className="flex items-center gap-1.5 text-xs text-danger-500 font-medium bg-danger-50 px-3 py-1.5 rounded-xl active:bg-danger-100"
          >
            <X size={13} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
