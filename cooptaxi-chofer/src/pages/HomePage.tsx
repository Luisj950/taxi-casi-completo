import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useCarreraStore } from '@/store/carrera.store';
import { useDespachoSocket } from '@/hooks/useSocket';
import { altaDemandaApi, authApi } from '@/lib/api';
import { Badge, Card, InfoRow } from '@/components/ui';
import { Star, Clock, AlertTriangle, CheckCircle, Wifi, LogOut } from 'lucide-react';
import dayjs from 'dayjs';

function diasDocBadge(dias: number) {
  if (dias <= 7)  return <Badge variant="red">{dias}d</Badge>;
  if (dias <= 15) return <Badge variant="amber">{dias}d</Badge>;
  return <Badge variant="green">Vigente</Badge>;
}

export default function HomePage() {
  const navigate   = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { incoming } = useCarreraStore();

  async function handleLogout() {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  }

  // Conectar al WebSocket al montar
  const { emit } = useDespachoSocket(user?.id ?? '');

  // Si llega una carrera → ir a la pantalla de aceptar
  useEffect(() => {
    if (incoming) navigate('/carrera-incoming');
  }, [incoming, navigate]);

  const docsProximos = (user?.documentos ?? [])
    .filter((d) => d.dias_restantes <= 15)
    .sort((a, b) => a.dias_restantes - b.dias_restantes);

  const tieneMora = (user?.cuotas ?? []).some((c) => !c.pagada);

  async function responderAltaDemanda() {
    await altaDemandaApi.responder();
    // El estado se actualiza por WebSocket
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">

      {/* Header */}
      <div className="bg-primary-600 px-5 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs">Bienvenido,</p>
            <h1 className="text-white text-lg font-bold">{user?.nombre}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/15 rounded-full px-3 py-1.5">
              <Wifi size={13} className="text-green-300" />
              <span className="text-white text-xs font-medium">En línea</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/15 rounded-full p-1.5 hover:bg-white/25 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={15} className="text-white" />
            </button>
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-white text-xl font-bold">#{user?.posicion_cola}</p>
            <p className="text-white/70 text-[11px]">en cola</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-white text-xl font-bold">{user?.total_carreras}</p>
            <p className="text-white/70 text-[11px]">carreras</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star size={14} className="text-amber-300 fill-amber-300" />
              <p className="text-white text-xl font-bold">{user?.rating_promedio.toFixed(1)}</p>
            </div>
            <p className="text-white/70 text-[11px]">rating</p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 -mt-4 space-y-3 pb-6">

        {/* Estado — esperando */}
        <Card className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center">
              <Clock size={22} className="text-success-600" />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Esperando carrera</p>
            <p className="text-xs text-gray-400">
              Puesto #{user?.posicion_cola} — {dayjs().format('HH:mm')}
            </p>
          </div>
        </Card>

        {/* Alerta mora */}
        {tieneMora && (
          <Card className="border-danger-200 bg-danger-50">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-danger-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-danger-800">Cuota pendiente</p>
                <p className="text-xs text-danger-600">
                  Tienes cuotas sin pagar. Tu acceso al despacho puede ser bloqueado. Contáctate con administración.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Alertas documentos */}
        {docsProximos.length > 0 && (
          <Card>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Documentos por vencer
            </p>
            {docsProximos.map((d) => (
              <InfoRow
                key={d.id}
                label={d.tipo}
                value={diasDocBadge(d.dias_restantes)}
              />
            ))}
          </Card>
        )}

        {/* Vehículo */}
        {user?.vehiculo && (
          <Card>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Mi vehículo
            </p>
            <InfoRow label="Placa"   value={user.vehiculo.placa} />
            <InfoRow label="Marca"   value={`${user.vehiculo.marca} ${user.vehiculo.modelo}`} />
          </Card>
        )}

        {/* Todo ok */}
        {docsProximos.length === 0 && !tieneMora && (
          <div className="flex items-center gap-2 bg-success-50 border border-success-200 rounded-2xl px-4 py-3">
            <CheckCircle size={16} className="text-success-600 flex-shrink-0" />
            <p className="text-xs text-success-700 font-medium">
              Documentos y cuotas al día. ¡Todo listo para operar!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
