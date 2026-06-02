import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentosApi } from '@/lib/api';
import { Card, Badge, SectionTitle, EmptyState, Spinner } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';
import type { Documento } from '@/types';

function diasBadge(dias: number) {
  if (dias <= 7)  return <Badge variant="red">{dias} días</Badge>;
  if (dias <= 15) return <Badge variant="amber">{dias} días</Badge>;
  return <Badge variant="green">{dias} días</Badge>;
}

export default function DocumentosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['docs-30'],
    queryFn:  () => documentosApi.list({ dias: 30 }),
    refetchInterval: 60_000,
  });

  const docs = (data?.data ?? []) as Documento[];

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-warn-400" />
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Documentos</h1>
          <p className="text-xs text-gray-400">Licencias, matrículas, SPPAT y RTV próximos a vencer</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(['LICENCIA','MATRICULA','SPPAT','RTV'] as const).map((tipo) => {
          const count = docs.filter((d) => d.tipo === tipo).length;
          return (
            <div key={tipo} className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400 mt-1">{tipo}</p>
            </div>
          );
        })}
      </div>

      <SectionTitle>Próximos 30 días</SectionTitle>
      <Card padding={false}>
        {isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
        {!isLoading && docs.length === 0 && <EmptyState message="Sin documentos próximos a vencer" icon="📄" />}
        {!isLoading && docs.length > 0 && (
          <table className="table-base">
            <thead>
              <tr>
                <th className="pl-4">Socio</th>
                <th>Tipo</th>
                <th>N° Documento</th>
                <th>Vence</th>
                <th>Días restantes</th>
                <th>Alerta enviada</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="pl-4 font-medium text-gray-800">{d.user?.nombre ?? '—'}</td>
                  <td><Badge variant={d.tipo === 'LICENCIA' ? 'purple' : d.tipo === 'SPPAT' ? 'blue' : 'gray'}>{d.tipo}</Badge></td>
                  <td className="font-mono text-xs text-gray-400">{d.numero_documento ?? '—'}</td>
                  <td>{dayjs(d.fecha_vencimiento).format('DD/MM/YYYY')}</td>
                  <td>{diasBadge(d.dias_restantes ?? 0)}</td>
                  <td>
                    {d.alerta_enviada
                      ? <Badge variant="green">Sí</Badge>
                      : <Badge variant="gray">No</Badge>}
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
