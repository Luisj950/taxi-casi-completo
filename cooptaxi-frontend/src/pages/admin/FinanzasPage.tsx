import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finanzasApi } from '@/lib/api';
import { Card, Badge, Button, Modal, Input, Select, SectionTitle, EmptyState, Spinner, StatCard } from '@/components/ui';
import { DollarSign } from 'lucide-react';
import dayjs from 'dayjs';
import type { Cuota } from '@/types';

export default function FinanzasPage() {
  const qc = useQueryClient();
  const [pagando, setPagando] = useState<Cuota | null>(null);
  const [comprobante, setComprobante] = useState('');
  const [metodo, setMetodo] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');

  const hoy   = dayjs().startOf('month').format('YYYY-MM-DD');
  const fin   = dayjs().endOf('month').format('YYYY-MM-DD');

  const { data: cuotasRes, isLoading } = useQuery({
    queryKey: ['cuotas'],
    queryFn:  () => finanzasApi.cuotas({ pagada: false, limit: 100 }),
    refetchInterval: 30_000,
  });

  const { data: reporteRes } = useQuery({
    queryKey: ['reporte', hoy, fin],
    queryFn:  () => finanzasApi.reporte(hoy, fin),
  });

  const pagar = useMutation({
    mutationFn: () =>
      finanzasApi.pagar(pagando!.id, { monto: pagando!.monto, metodo, comprobante }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cuotas'] });
      qc.invalidateQueries({ queryKey: ['reporte'] });
      setPagando(null);
    },
  });

  const cuotas  = (cuotasRes?.data?.data ?? []) as Cuota[];
  const reporte = reporteRes?.data;

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center gap-2">
        <DollarSign size={18} className="text-success-600" />
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Finanzas</h1>
          <p className="text-xs text-gray-400">Cuotas, pagos y reporte mensual</p>
        </div>
      </div>

      {/* Resumen del mes */}
      {reporte && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard label="Recaudado este mes" value={`$${reporte.total_recaudado}`} subVariant="up" />
          <StatCard label="Cuotas cobradas"    value={reporte.cuotas_cobradas} />
          <StatCard label="Multas cobradas"    value={reporte.multas_cobradas} />
          <StatCard label="Socios en mora"     value={reporte.socios_en_mora} subVariant={reporte.socios_en_mora > 0 ? 'warn' : 'neutral'} />
        </div>
      )}

      <SectionTitle>Cuotas pendientes de pago</SectionTitle>
      <Card padding={false}>
        {isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
        {!isLoading && cuotas.length === 0 && <EmptyState message="Todos los socios al día" icon="✅" />}
        {!isLoading && cuotas.length > 0 && (
          <table className="table-base">
            <thead>
              <tr>
                <th className="pl-4">Socio</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Vence</th>
                <th>Descripción</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map((c) => {
                const vencida = dayjs(c.fecha_vencimiento).isBefore(dayjs(), 'day');
                return (
                  <tr key={c.id}>
                    <td className="pl-4 font-medium text-gray-800">{c.socio?.nombre ?? '—'}</td>
                    <td>
                      <Badge variant={c.tipo === 'MULTA' ? 'red' : 'purple'}>{c.tipo}</Badge>
                    </td>
                    <td className="font-semibold text-gray-800">${Number(c.monto).toFixed(2)}</td>
                    <td>
                      <span className={vencida ? 'text-danger-600 font-medium' : 'text-gray-500'}>
                        {dayjs(c.fecha_vencimiento).format('DD/MM/YYYY')}
                      </span>
                    </td>
                    <td className="text-gray-400 text-xs">{c.descripcion ?? '—'}</td>
                    <td>
                      <Button size="xs" onClick={() => setPagando(c)}>
                        Registrar pago
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal pago */}
      <Modal
        open={!!pagando}
        onClose={() => setPagando(null)}
        title="Registrar pago"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPagando(null)}>Cancelar</Button>
            <Button size="sm" loading={pagar.isPending} onClick={() => pagar.mutate()}>
              Confirmar pago
            </Button>
          </>
        }
      >
        {pagando && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-800">{pagando.socio?.nombre}</p>
              <p className="text-gray-500">{pagando.tipo} — <span className="font-semibold">${Number(pagando.monto).toFixed(2)}</span></p>
            </div>
            <Select
              label="Método de pago"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as typeof metodo)}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </Select>
            <Input
              label="Número de comprobante (opcional)"
              placeholder="REC-001"
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
