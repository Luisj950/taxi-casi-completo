import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarreraStore } from '@/store/carrera.store';
import { despachoApi } from '@/lib/api';
import { Button, StarRating } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

const COMENTARIOS_RAPIDOS = [
  '¡Excelente servicio! 👍',
  'Muy puntual',
  'Conductor amable',
  'Ruta correcta',
  'Vehículo limpio',
];

export default function CalificarPage() {
  const navigate   = useNavigate();
  const { paraCalificar, clear } = useCarreraStore();
  const [stars,      setStars]     = useState(5);
  const [comentario, setComentario]= useState('');
  const [loading,    setLoading]   = useState(false);
  const [completado, setCompletado]= useState(false);

  async function handleCalificar() {
    if (!paraCalificar) return;
    setLoading(true);
    try {
      await despachoApi.calificar(paraCalificar.id, stars, comentario || undefined);
      setCompletado(true);
    } catch {
      // Aunque falle, continuar — la calificación es opcional
      setCompletado(true);
    } finally {
      setLoading(false);
    }
  }

  function handleFinalizar() {
    clear();
    navigate('/home', { replace: true });
  }

  if (!paraCalificar && !completado) {
    navigate('/home', { replace: true });
    return null;
  }

  if (completado) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-white px-6 text-center fade-in">
        <div className="w-28 h-28 rounded-full bg-brand-50 flex items-center justify-center mb-6">
          <CheckCircle size={56} className="text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias!</h2>
        <p className="text-gray-400 text-sm mb-2">Tu calificación ayuda a mejorar el servicio.</p>
        <div className="flex gap-0.5 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-2xl ${i < stars ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
          ))}
        </div>
        <Button fullWidth size="xl" onClick={handleFinalizar}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-brand-600 px-5 pt-8 pb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={36} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">¡Llegaste!</h2>
        <p className="text-white/70 text-sm mt-1">
          #{paraCalificar?.id.slice(-8).toUpperCase()}
        </p>
      </div>

      <div className="flex-1 px-5 py-6 overflow-y-auto space-y-6">

        {/* Chofer info */}
        {paraCalificar?.chofer && (
          <div className="flex items-center gap-4 bg-gray-50 rounded-2xl px-4 py-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-3xl flex-shrink-0">
              👨‍✈️
            </div>
            <div>
              <p className="font-semibold text-gray-800">{paraCalificar.chofer.nombre}</p>
              <p className="text-xs text-gray-400">
                {paraCalificar.chofer.vehiculo?.placa} · {paraCalificar.chofer.vehiculo?.marca}
              </p>
            </div>
          </div>
        )}

        {/* Estrellas */}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 mb-4">¿Cómo fue tu viaje?</p>
          <StarRating value={stars} onChange={setStars} />
          <p className="text-xs text-gray-400 mt-3">
            {stars === 5 ? '¡Excelente! 🎉' :
             stars === 4 ? 'Muy bueno 👍' :
             stars === 3 ? 'Regular' :
             stars === 2 ? 'Podría mejorar' : 'Mala experiencia'}
          </p>
        </div>

        {/* Comentarios rápidos */}
        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium">Toca para agregar:</p>
          <div className="flex flex-wrap gap-2">
            {COMENTARIOS_RAPIDOS.map((c) => (
              <button
                key={c}
                onClick={() => setComentario(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  comentario === c
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Comentario libre */}
        <div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Escribe un comentario (opcional)..."
            rows={3}
            className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="px-5 pb-8 pt-3 space-y-3 border-t border-gray-100">
        <Button fullWidth size="xl" onClick={handleCalificar} loading={loading}>
          Enviar calificación ★
        </Button>
        <Button fullWidth size="md" variant="ghost" onClick={handleFinalizar}>
          Omitir
        </Button>
      </div>
    </div>
  );
}
