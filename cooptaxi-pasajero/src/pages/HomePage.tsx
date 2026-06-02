import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useCarreraStore } from '@/store/carrera.store';
import { useGPS } from '@/hooks/useSocket';
import { despachoApi, authApi } from '@/lib/api';
import { Button, LocationInput, Card } from '@/components/ui';
import { MapPin, Navigation, Clock, LogOut } from 'lucide-react';
import type { SolicitudData } from '@/types';

// Sugerencias de destinos frecuentes (en producción vendrían del historial)
const FRECUENTES = [
  'Terminal Terrestre',
  'Hospital del IESS',
  'Aeropuerto Mariscal',
  'Mall del Río',
  'Mercado 10 de Agosto',
  'Universidad del Azuay',
];

export default function HomePage() {
  const navigate   = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { setSolicitud, setCarrera } = useCarreraStore();
  const { getCoords } = useGPS();

  const [origen,   setOrigen]   = useState('');
  const [destino,  setDestino]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [usingGPS, setUsingGPS] = useState(false);

  async function usarMiUbicacion() {
    setUsingGPS(true);
    const coords = getCoords();
    if (coords) {
      setOrigen(`Mi ubicación (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
    } else {
      setOrigen('Obteniendo ubicación...');
      navigator.geolocation?.getCurrentPosition(
        (pos) => setOrigen(`Mi ubicación (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`),
        () => setOrigen('No se pudo obtener la ubicación'),
      );
    }
    setUsingGPS(false);
  }

  async function handleSolicitar() {
    if (!origen.trim() || !destino.trim()) {
      setError('Ingresa el origen y el destino.');
      return;
    }
    setError('');
    setLoading(true);

    const coords = getCoords();
    const solicitudData: SolicitudData = {
      origen:  { lat: coords?.lat ?? -2.9001, lng: coords?.lng ?? -79.0059, descripcion: origen },
      destino: { lat: -2.9123, lng: -79.0145, descripcion: destino }, // coords del destino en prod
    };

    try {
      setSolicitud(solicitudData);
      const { data } = await despachoApi.solicitar(solicitudData);
      setCarrera({ ...data, estado: 'PENDIENTE', origen_descripcion: origen, destino_descripcion: destino, created_at: new Date().toISOString() } as any);
      navigate('/esperando');
    } catch {
      setError('No se pudo solicitar el taxi. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-brand-600 px-5 pt-6 pb-10">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-white/70 text-xs">Hola,</p>
            <h1 className="text-white font-bold text-lg leading-tight">{user?.nombre}</h1>
          </div>
          <button onClick={handleLogout} className="bg-white/15 rounded-full p-2">
            <LogOut size={16} className="text-white" />
          </button>
        </div>
        <p className="text-white/60 text-xs mt-1">¿A dónde vamos hoy?</p>
      </div>

      {/* Formulario de solicitud — flota sobre el header */}
      <div className="px-4 -mt-5 space-y-2.5 slide-up">
        <Card className="space-y-2">
          {/* Origen */}
          <div className="relative">
            <LocationInput
              label="Origen"
              value={origen}
              onChange={setOrigen}
              placeholder="¿Dónde estás?"
              icon={<MapPin size={18} />}
              iconColor="text-primary-500"
            />
            <button
              onClick={usarMiUbicacion}
              disabled={usingGPS}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-600 font-medium bg-brand-50 px-2 py-1 rounded-lg"
            >
              <Navigation size={12} className="inline mr-1" />
              GPS
            </button>
          </div>

          {/* Separador con línea */}
          <div className="flex items-center gap-2 px-1">
            <div className="w-4" />
            <div className="flex-1 border-t border-dashed border-gray-200" />
          </div>

          {/* Destino */}
          <LocationInput
            label="Destino"
            value={destino}
            onChange={setDestino}
            placeholder="¿A dónde vas?"
            icon={<MapPin size={18} />}
            iconColor="text-brand-500"
          />
        </Card>

        {error && (
          <p className="text-xs text-danger-600 bg-danger-50 px-4 py-2 rounded-xl">{error}</p>
        )}

        {/* Estimado de tarifa */}
        {origen && destino && (
          <div className="flex items-center justify-between bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-brand-500" />
              <span className="text-sm text-brand-700">Tarifa estimada</span>
            </div>
            <span className="text-sm font-bold text-brand-700">$1.50 – $3.00</span>
          </div>
        )}

        <Button fullWidth size="xl" onClick={handleSolicitar} loading={loading}>
          Solicitar taxi 🚕
        </Button>
      </div>

      {/* Destinos frecuentes */}
      <div className="px-4 mt-5 flex-1 overflow-y-auto pb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Destinos frecuentes
        </p>
        <div className="space-y-2">
          {FRECUENTES.map((lugar) => (
            <button
              key={lugar}
              onClick={() => setDestino(lugar)}
              className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 text-left active:bg-gray-50 transition-colors"
            >
              <MapPin size={15} className="text-gray-300 flex-shrink-0" />
              <span className="text-sm text-gray-700">{lugar}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
