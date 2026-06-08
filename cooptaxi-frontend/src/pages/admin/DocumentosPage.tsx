import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentosApi, usersApi } from '@/lib/api';
import { Card, Badge, Button, Modal, Input, Select, SectionTitle, EmptyState, Spinner } from '@/components/ui';
import { AlertTriangle, FilePlus } from 'lucide-react';
import dayjs from 'dayjs';
import type { Documento, User } from '@/types';

function diasBadge(dias: number) {
  if (dias <= 7)  return <Badge variant="red">{dias} días</Badge>;
  if (dias <= 15) return <Badge variant="amber">{dias} días</Badge>;
  return <Badge variant="green">{dias} días</Badge>;
}

export default function DocumentosPage() {
  const qc = useQueryClient();
  const [openModal, setModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    user_id: '',
    tipo: 'LICENCIA' as 'LICENCIA' | 'MATRICULA' | 'SPPAT' | 'RTV',
    numero_documento: '',
    fecha_vencimiento: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['docs-30'],
    queryFn:  () => documentosApi.list({ dias: 30 }),
    refetchInterval: 60_000,
  });

  const { data: sociosRes } = useQuery({
    queryKey: ['socios-select'],
    queryFn:  () => usersApi.list({ rol: 'CHOFER', limit: 100 }),
  });

  const crear = useMutation({
    mutationFn: () => documentosApi.create(form),
    onSuccess: () => {
      setFormError('');
      qc.invalidateQueries({ queryKey: ['docs-30'] });
      setModal(false);
      setForm({ user_id: '', tipo: 'LICENCIA', numero_documento: '', fecha_vencimiento: '' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al registrar el documento.'));
    },
  });

  const docs   = (data?.data ?? []) as Documento[];
  const socios = ((sociosRes?.data?.data ?? []) as User[]);

  const canSubmit = form.user_id && form.tipo && form.fecha_vencimiento;

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-warn-400" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Documentos</h1>
            <p className="text-xs text-gray-400">Licencias, matrículas, SPPAT y RTV</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setModal(true)}>
          <FilePlus size={14} /> Registrar documento
        </Button>
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

      <SectionTitle>Próximos 30 días a vencer</SectionTitle>
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

      {/* Modal registrar documento */}
      <Modal
        open={openModal}
        onClose={() => setModal(false)}
        title="Registrar documento"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModal(false)}>Cancelar</Button>
            <Button size="sm" loading={crear.isPending} disabled={!canSubmit} onClick={() => crear.mutate()}>
              Registrar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Socio / Chofer"
            value={form.user_id}
            onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
          >
            <option value="">Selecciona un socio...</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre} — {s.email}</option>
            ))}
          </Select>
          <Select
            label="Tipo de documento"
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as typeof form.tipo }))}
          >
            <option value="LICENCIA">Licencia de conducir</option>
            <option value="MATRICULA">Matrícula vehicular</option>
            <option value="SPPAT">SPPAT</option>
            <option value="RTV">RTV (Revisión Técnica)</option>
          </Select>
          <Input
            label="Número de documento (opcional)"
            placeholder="Ej: LIC-001234"
            value={form.numero_documento}
            onChange={(e) => setForm((f) => ({ ...f, numero_documento: e.target.value }))}
          />
          <Input
            label="Fecha de vencimiento"
            type="date"
            value={form.fecha_vencimiento}
            onChange={(e) => setForm((f) => ({ ...f, fecha_vencimiento: e.target.value }))}
          />
          {formError && (
            <p className="text-xs text-danger-700 bg-danger-50 border border-danger-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
