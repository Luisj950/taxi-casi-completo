import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarreraStore } from '@/store/carrera.store';
import { despachoApi } from '@/lib/api';
import { Button } from '@/components/ui';
import { MapPin, Clock } from 'lucide-react';

const TIMEOUT = 60; // segundos
const CIRCUNFERENCIA = 2 * Math.PI * 45; // radio 45

export default function CarreraIncomingPage() {
  const navigate     = useNavigate();
  const { incoming, setActiva, setIncoming } = useCarreraStore();
  const [segundos,   setSegundos]  = useState(TIMEOUT);
  const [accepting,  setAccepting] = useState(false);
  const [rejecting,  setRejecting] = useState(false);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirigir si no hay carrera entrante
  useEffect(() => {
    if (!incoming) { navigate('/home', { replace: true }); return; }
    // Vibración al entrar
    if ('vibrate' in navigator) navigator.vibrate([300, 150, 300, 150, 300]);
  }, [incoming, navigate]);

  // Cuenta regresiva
  useEffect(() => {
    if (!incoming) return;
    intervalRef.current = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          handleRechazar();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [incoming]);

  async function handleAceptar() {
    if (!incoming || accepting) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAccepting(true);
    try {
      await despachoApi.responder(incoming.carrera_id, 'ACEPTAR');
      setActiva({ ...incoming, estado: 'EN_RUTA' });
      navigate('/en-ruta', { replace: true });
    } catch {
      setIncoming(null);
      navigate('/home', { replace: true });
    }
  }

  async function handleRechazar() {
    if (!incoming || rejecting) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRejecting(true);
    try {
      await despachoApi.responder(incoming.carrera_id, 'RECHAZAR');
    } finally {
      setIncoming(null);
      navigate('/home', { replace: true });
    }
  }

  if (!incoming) return null;

  const progreso = ((TIMEOUT - segundos) / TIMEOUT) * CIRCUNFERENCIA;
  const color    = segundos > 20 ? '#534AB7' : segundos > 10 ? '#BA7517' : '#E24B4A';
  const urgente  = segundos <= 10;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top — contador circular */}
      <div className={`flex flex-col items-center justify-center pt-10 pb-8 px-6 transition-colors duration-500 ${urgente ? 'bg-danger-50' : 'bg-primary-50'}`}>
        <div className="relative w-36 h-36 mb-4">
          {/* Anillo de progreso SVG */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={color} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUNFERENCIA}
              strokeDashoffset={progreso}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
            />
          </svg>
          {/* Número */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold tabular-nums ${urgente ? 'text-danger-600' : 'text-primary-600'}`}>
              {segundos}
            </span>
            <span className="text-xs text-gray-400">segundos</span>
          </div>
        </div>

        <p className="text-lg font-bold text-gray-900">Nueva carrera</p>
        <p className="text-sm text-gray-400">Responde antes de que expire el tiempo</p>
      </div>

      {/* Detalle de la carrera */}
      <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto">

        {/* Origen */}
        <div className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Punto de recogida</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {incoming.origen.descripcion || `${incoming.origen.lat.toFixed(4)}, ${incoming.origen.lng.toFixed(4)}`}
            </p>
          </div>
        </div>

        {/* Destino */}
        <div className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-success-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Destino</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {incoming.destino.descripcion || `${incoming.destino.lat.toFixed(4)}, ${incoming.destino.lng.toFixed(4)}`}
            </p>
          </div>
        </div>

        {/* Código carrera */}
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
          <span className="text-xs text-gray-400">Código de carrera</span>
          <span className="text-xs font-mono font-semibold text-gray-700">
            #{incoming.carrera_id.slice(-8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-5 pb-8 pt-3 space-y-3 border-t border-gray-100">
        <Button
          fullWidth
          size="xl"
          variant="success"
          onClick={handleAceptar}
          loading={accepting}
          className="text-base"
        >
          ✓ Aceptar carrera
        </Button>
        <Button
          fullWidth
          size="md"
          variant="secondary"
          onClick={handleRechazar}
          loading={rejecting}
        >
          Rechazar
        </Button>
      </div>
    </div>
  );
}
