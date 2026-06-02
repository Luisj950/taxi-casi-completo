import { useQuery } from '@tanstack/react-query';
import { seguridadApi } from '@/lib/api';
import { Card, Badge, SectionTitle, EmptyState, Spinner } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';

export default function IncidentesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['incidentes'],
    queryFn:  () => seguridadApi.incidentes({ limit: 50 }),
    refetchInterval: 30_000,
  });

  const items = data?.data?.data ?? [];

  function tipoBadge(tipo: string) {
    if (tipo === 'PANICO')              return <Badge variant="red">Pánico</Badge>;
    if (tipo === 'PASAJERO_CONFLICTIVO') return <Badge variant="amber">Pasajero conflictivo</Badge>;
    if (tipo === 'ZONA_PELIGROSA')      return <Badge variant="amber">Zona peligrosa</Badge>;
    if (tipo === 'ACCIDENTE')           return <Badge variant="red">Accidente</Badge>;
    return <Badge variant="gray">{tipo}</Badge>;
  }

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-danger-400" />
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Incidentes</h1>
          <p className="text-xs text-gray-400">Registro de alertas de pánico, zonas peligrosas y reportes</p>
        </div>
      </div>

      <SectionTitle>Incidentes registrados</SectionTitle>
      <Card padding={false}>
        {isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
        {!isLoading && items.length === 0 && <EmptyState message="Sin incidentes registrados" icon="✅" />}
        {!isLoading && items.length > 0 && (
          <table className="table-base">
            <thead>
              <tr>
                <th className="pl-4">Fecha</th>
                <th>Tipo</th>
                <th>Chofer</th>
                <th>Descripción</th>
                <th>Coordenadas</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i: any) => (
                <tr key={i.id}>
                  <td className="pl-4 text-gray-500">{dayjs(i.created_at).format('DD/MM/YYYY HH:mm')}</td>
                  <td>{tipoBadge(i.tipo)}</td>
                  <td className="font-medium text-gray-800">{i.chofer?.nombre ?? '—'}</td>
                  <td className="text-gray-500 max-w-[200px] truncate">{i.descripcion ?? '—'}</td>
                  <td className="font-mono text-xs text-gray-400">
                    {i.lat ? `${Number(i.lat).toFixed(4)}, ${Number(i.lng).toFixed(4)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
