import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarreraStore } from '@/store/carrera.store';
import { useAuthStore } from '@/store/auth.store';
import { useDespachoSocket, useGPS } from '@/hooks/useSocket';
import { despachoApi, seguridadApi } from '@/lib/api';
import { Button, PanicButton, QuickReplies, Card } from '@/components/ui';
import { MapPin, Navigation, Phone } from 'lucide-react';
import dayjs from 'dayjs';

export default function EnRutaPage() {
  const navigate    = useNavigate();
  const { user }    = useAuthStore();
  const { activa, setCompletada } = useCarreraStore();
  const { emit }    = useDespachoSocket(user?.id ?? '');
  const { coords }  = useGPS(true);
  const [completing, setCompleting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [panicoEnviado, setPanicoEnviado] = useState(false);
  const gpsInterval  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activa) { navigate('/home', { replace: true }); return; }
  }, [activa, navigate]);

  // Enviar GPS cada 5 segundos al gateway
  useEffect(() => {
    if (!activa || !coords) return;
    gpsInterval.current = setInterval(() => {
      emit('gps_update', {
        chofer_id:  user?.id,
        lat:        coords.lat,
        lng:        coords.lng,
        carrera_id: activa.carrera_id,
      });
    }, 5000);
    return () => { if (gpsInterval.current) clearInterval(gpsInterval.current); };
  }, [activa, coords, emit, user?.id]);

  async function handleCompletar() {
    if (!activa || completing) return;
    setCompleting(true);
    try {
      const { data } = await despachoApi.completar(activa.carrera_id, 5);
      setCompletada({
        carrera_id:           activa.carrera_id,
        duracion_min:         data.duracion_min,
        calificacion_recibida: undefined,
      });
      navigate('/completada', { replace: true });
    } catch {
      setCompleting(false);
    }
  }

  async function handlePanico() {
    if (!coords || panicoEnviado) return;
    setPanicoEnviado(true);
    await seguridadApi.panico(coords.lat, coords.lng, activa?.carrera_id);
    if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
  }

  if (!activa) return null;

  const tiempoEnRuta = dayjs().diff(dayjs(activa.carrera_id), 'minute'); // aproximado

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Header estado */}
      <div className="bg-success-600 px-5 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-sm font-semibold">En ruta</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
            <Navigation size={12} className="text-white" />
            <span className="text-white text-xs">
              {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Obteniendo GPS...'}
            </span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">

        {/* Origen → Destino */}
        <Card>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <MapPin size={14} className="text-primary-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Desde</p>
              <p className="text-sm font-medium text-gray-800">
                {activa.origen.descripcion || 'Punto de origen'}
              </p>
            </div>
          </div>
          <div className="border-l-2 border-dashed border-gray-200 ml-3.5 h-4 mb-3" />
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
              <MapPin size={14} className="text-success-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Hasta</p>
              <p className="text-sm font-medium text-gray-800">
                {activa.destino.descripcion || 'Punto de destino'}
              </p>
            </div>
          </div>
        </Card>

        {/* Respuestas rápidas */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Respuestas rápidas al pasajero
            </p>
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-primary-600 font-medium"
            >
              {showReplies ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {showReplies && (
            <QuickReplies
              onSelect={(msg) => {
                emit('chat_quick', { carrera_id: activa.carrera_id, contenido: msg });
                setShowReplies(false);
              }}
            />
          )}
          {!showReplies && (
            <p className="text-xs text-gray-400">
              Toca "Mostrar" para enviarle un mensaje al pasajero sin escribir.
            </p>
          )}
        </Card>

        {/* Código */}
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3">
          <span className="text-xs text-gray-400">Código de carrera</span>
          <span className="text-xs font-mono font-semibold text-gray-700">
            #{activa.carrera_id.slice(-8).toUpperCase()}
          </span>
        </div>

        {/* Alerta pánico enviada */}
        {panicoEnviado && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl px-4 py-3 text-center">
            <p className="text-sm font-bold text-danger-800">🚨 Alerta enviada</p>
            <p className="text-xs text-danger-600 mt-1">
              La central y unidades cercanas fueron notificadas.
            </p>
          </div>
        )}
      </div>

      {/* Acciones inferiores */}
      <div className="px-4 pb-8 pt-3 space-y-3 border-t border-gray-100 bg-white">
        <Button
          fullWidth size="xl" variant="success"
          onClick={handleCompletar}
          loading={completing}
        >
          ✓ Llegué al destino
        </Button>
        {!panicoEnviado && (
          <PanicButton onPress={handlePanico} />
        )}
      </div>
    </div>
  );
}
