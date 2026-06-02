import { useQuery } from '@tanstack/react-query';
import { usersApi, despachoApi, documentosApi, altaDemandaApi } from '@/lib/api';
import { StatCard, Card, Badge, SectionTitle, Spinner } from '@/components/ui';
import { Users, Car, FileText, DollarSign, Zap, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';
import type { User, Carrera, Documento, EstadoAltaDemanda } from '@/types';

function estadoBadge(u: User) {
  if (u.cuotas?.some((c) => !c.pagada))  return <Badge variant="red">Mora</Badge>;
  if (u.estado_chofer === 'EN_CARRERA')  return <Badge variant="blue">En carrera</Badge>;
  if (u.estado_chofer === 'DISPONIBLE')  return <Badge variant="green">Disponible</Badge>;
  return <Badge variant="gray">Inactivo</Badge>;
}

function diasBadge(dias: number) {
  if (dias <= 7)  return <Badge variant="red">{dias}d</Badge>;
  if (dias <= 15) return <Badge variant="amber">{dias}d</Badge>;
  return <Badge variant="green">{dias}d</Badge>;
}

export default function DashboardPage() {
  const { data: sociosRes } = useQuery({
    queryKey: ['socios'],
    queryFn:  () => usersApi.list({ rol: 'CHOFER', limit: 50 }),
  });
  const { data: carrerasRes } = useQuery({
    queryKey: ['carreras-hoy'],
    queryFn:  () => despachoApi.carreras({ desde: dayjs().startOf('day').toISOString(), limit: 6 }),
    refetchInterval: 30_000,
  });
  const { data: docsRes } = useQuery({
    queryKey: ['docs-proximos'],
    queryFn:  () => documentosApi.list({ dias: 15 }),
    refetchInterval: 60_000,
  });
  const { data: altaRes } = useQuery({
    queryKey: ['alta-demanda'],
    queryFn:  () => altaDemandaApi.estado(),
    refetchInterval: 15_000,
  });

  const socios   = (sociosRes?.data?.data   as User[])      ?? [];
  const carreras = (carrerasRes?.data?.data  as Carrera[])   ?? [];
  const docs     = (docsRes?.data           as Documento[])  ?? [];
  const alta     = altaRes?.data             as EstadoAltaDemanda | undefined;

  const activos      = socios.filter((s) => s.activo).length;
  const enMora       = socios.filter((s) => s.cuotas?.some((c) => !c.pagada)).length;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400">{dayjs().format('dddd, D MMMM YYYY')}</p>
        </div>
      </div>

      {/* Banner alta demanda */}
      {alta?.modo_alta_demanda && (
        <div className="flex items-center gap-3 bg-warn-50 border border-warn-200 rounded-xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-warn-400 pulse-dot flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-warn-800">Modo alta demanda activo</p>
            <p className="text-xs text-warn-600">
              {alta.solicitudes_pendientes} solicitudes · {alta.conductores_disponibles} conductores disponibles
            </p>
          </div>
          <Zap size={17} className="text-warn-400" />
        </div>
      )}

      {/* Métricas */}
      <section>
        <SectionTitle>Resumen del día</SectionTitle>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard label="Carreras hoy"     value={carrerasRes?.data?.total ?? 0} icon={<Car size={20}/>} />
          <StatCard label="Socios activos"   value={activos} sub={`de ${socios.length} total`} icon={<Users size={20}/>} />
          <StatCard label="En mora"          value={enMora}  subVariant={enMora > 0 ? 'warn' : 'neutral'} sub={enMora > 0 ? 'acceso bloqueado' : 'Todo al día'} icon={<DollarSign size={20}/>} />
          <StatCard label="Docs por vencer"  value={docs.length} subVariant={docs.length > 0 ? 'warn' : 'neutral'} sub="próximos 15 días" icon={<FileText size={20}/>} />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Alertas documentos */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700">Documentos próximos a vencer</p>
            <AlertTriangle size={15} className="text-warn-400" />
          </div>
          {docs.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">Todos los documentos al día ✓</p>
            : (
              <table className="table-base">
                <thead><tr><th>Socio</th><th>Tipo</th><th>Vence</th><th>Días</th></tr></thead>
                <tbody>
                  {docs.slice(0, 7).map((d) => (
                    <tr key={d.id}>
                      <td className="font-medium text-gray-800">{d.user?.nombre ?? '—'}</td>
                      <td>{d.tipo}</td>
                      <td>{dayjs(d.fecha_vencimiento).format('DD/MM/YYYY')}</td>
                      <td>{diasBadge(d.dias_restantes ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Card>

        {/* Carreras recientes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700">Últimas carreras</p>
            <Badge variant="purple">{carrerasRes?.data?.total ?? 0} hoy</Badge>
          </div>
          {carreras.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">Sin carreras aún hoy</p>
            : (
              <table className="table-base">
                <thead><tr><th>Chofer</th><th>Destino</th><th>Estado</th><th>Hora</th></tr></thead>
                <tbody>
                  {carreras.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium text-gray-800">{c.chofer?.nombre ?? '—'}</td>
                      <td className="max-w-[130px] truncate text-gray-500">{c.destino_descripcion ?? '—'}</td>
                      <td>
                        {c.estado === 'COMPLETADA' && <Badge variant="green">Completada</Badge>}
                        {c.estado === 'EN_RUTA'    && <Badge variant="blue">En ruta</Badge>}
                        {c.estado === 'PENDIENTE'  && <Badge variant="amber">Pendiente</Badge>}
                        {c.estado === 'CANCELADA'  && <Badge variant="red">Cancelada</Badge>}
                      </td>
                      <td>{dayjs(c.created_at).format('HH:mm')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Card>
      </div>

      {/* Tabla socios */}
      <section>
        <SectionTitle>Estado de socios</SectionTitle>
        <Card padding={false}>
          <table className="table-base">
            <thead>
              <tr>
                <th className="pl-4">Socio</th>
                <th>Placa</th>
                <th>Rating</th>
                <th>Carreras</th>
                <th>Cola</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {socios.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8 text-sm">Cargando socios...</td></tr>
              )}
              {socios.map((s) => (
                <tr key={s.id}>
                  <td className="pl-4 font-medium text-gray-800">{s.nombre}</td>
                  <td className="font-mono text-xs">{s.vehiculo?.placa ?? '—'}</td>
                  <td><span className="text-amber-400">★</span> {s.rating_promedio.toFixed(1)}</td>
                  <td>{s.total_carreras}</td>
                  <td className="text-gray-400">#{s.posicion_cola}</td>
                  <td>{estadoBadge(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
