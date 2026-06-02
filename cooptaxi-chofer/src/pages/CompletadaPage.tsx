import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarreraStore } from '@/store/carrera.store';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui';
import { Star, Clock, CheckCircle } from 'lucide-react';

export default function CompletadaPage() {
  const navigate     = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { completada, clear } = useCarreraStore();

  useEffect(() => {
    if (!completada) { navigate('/home', { replace: true }); return; }
    // Actualizar contador de carreras localmente
    if (user) updateUser({ total_carreras: user.total_carreras + 1 });
  }, []);

  function handleVolver() {
    clear();
    navigate('/home', { replace: true });
  }

  if (!completada) return null;

  const calificacion = completada.calificacion_recibida;

  return (
    <div className="flex flex-col h-full bg-white items-center justify-center px-6 text-center">

      {/* Ícono éxito */}
      <div className="w-24 h-24 rounded-full bg-success-50 flex items-center justify-center mb-6 shadow-sm">
        <CheckCircle size={48} className="text-success-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Carrera completada!</h1>
      <p className="text-sm text-gray-400 mb-8">
        Código #{completada.carrera_id.slice(-8).toUpperCase()}
      </p>

      {/* Stats */}
      <div className="w-full space-y-3 mb-8">

        <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={18} />
            <span className="text-sm">Duración</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">
            {completada.duracion_min} min
          </span>
        </div>

        {/* Calificación recibida */}
        <div className="flex items-center justify-between bg-amber-50 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 text-amber-600">
            <Star size={18} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium">Calificación del pasajero</span>
          </div>
          <div className="flex gap-0.5">
            {calificacion
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < calificacion ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                  />
                ))
              : <span className="text-sm text-gray-400">Pendiente...</span>
            }
          </div>
        </div>

        {/* Nueva posición en cola */}
        <div className="flex items-center justify-between bg-primary-50 rounded-2xl px-5 py-4">
          <span className="text-sm text-primary-700">Tu nueva posición en cola</span>
          <span className="text-lg font-bold text-primary-700">#{user?.posicion_cola}</span>
        </div>

        {/* Rating acumulado */}
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4">
          <span className="text-sm text-gray-500">Rating promedio</span>
          <div className="flex items-center gap-1">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-gray-800">
              {user?.rating_promedio.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <Button fullWidth size="xl" onClick={handleVolver}>
        Volver a esperar carrera
      </Button>
    </div>
  );
}
