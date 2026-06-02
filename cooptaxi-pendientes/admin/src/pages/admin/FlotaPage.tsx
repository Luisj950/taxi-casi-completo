// cooptaxi-frontend/src/pages/admin/FlotaPage.tsx
// Reemplaza el archivo FlotaPage.tsx existente con esta versión completa

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { flotaApi, usersApi } from '@/lib/api';
import {
  Card, Button, Badge, Input, Select, Modal,
  SectionTitle, EmptyState, Spinner, StatCard,
} from '@/components/ui';
import { Car, Plus, Wrench, History } from 'lucide-react';
import dayjs from 'dayjs';
import type { Vehiculo, User, Mantenimiento } from '@/types';

// ── Tipos de formularios ──────────────────────────────────────
interface VehiculoForm {
  socio_id:  string;
  placa:     string;
  marca:     string;
  modelo:    string;
  anio:      number;
  color:     string;
}

interface MantenimientoForm {
  tipo:        string;
  descripcion: string;
  km_actual:   number;
  costo:       number;
  fecha:       string;
}

const TIPOS_MANT = ['ACEITE', 'FRENOS', 'LLANTAS', 'GENERAL', 'OTRO'];

type Vista = 'lista' | 'mantenimiento';

export default function FlotaPage() {
  const qc = useQueryClient();
  const [vista,         setVista]         = useState<Vista>('lista');
  const [modalVehiculo, setModalVehiculo] = useState(false);
  const [modalMant,     setModalMant]     = useState(false);
  const [vehiculoSel,   setVehiculoSel]   = useState<Vehiculo | null>(null);

  // ── Queries ──────────────────────────────────────────────────
  const { data: flotaRes, isLoading } = useQuery({
    queryKey: ['vehiculos'],
    queryFn:  () => flotaApi.vehiculos({ activo: true }),
  });

  const { data: sociosRes } = useQuery({
    queryKey: ['socios-select'],
    queryFn:  () => usersApi.list({ rol: 'CHOFER', limit: 100 }),
  });

  const { data: historialRes, isLoading: loadHist } = useQuery({
    queryKey: ['mantenimiento', vehiculoSel?.id],
    queryFn:  () => flotaApi.historial(vehiculoSel!.id),
    enabled:  !!vehiculoSel && vista === 'mantenimiento',
  });

  // ── Mutations ─────────────────────────────────────────────────
  const crearVehiculo = useMutation({
    mutationFn: (d: VehiculoForm) => flotaApi.crear(d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['vehiculos'] }); setModalVehiculo(false); },
  });

  const registrarMant = useMutation({
    mutationFn: (d: MantenimientoForm) => flotaApi.mantenimiento(vehiculoSel!.id, d),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['mantenimiento', vehiculoSel?.id] });
      qc.invalidateQueries({ queryKey: ['vehiculos'] });
      setModalMant(false);
      resetMant();
    },
  });

  // ── Forms ─────────────────────────────────────────────────────
  const {
    register: regV, handleSubmit: hsV,
    formState: { errors: errV, isSubmitting: subV }, reset: resetV,
  } = useForm<VehiculoForm>({ defaultValues: { anio: 2020 } });

  const {
    register: regM, handleSubmit: hsM,
    formState: { errors: errM, isSubmitting: subM }, reset: resetMant,
  } = useForm<MantenimientoForm>({
    defaultValues: { tipo: 'ACEITE', fecha: dayjs().format('YYYY-MM-DD') },
  });

  const vehiculos = (flotaRes?.data?.data ?? []) as (Vehiculo & {
    socio?: { nombre: string }; documentos_vencidos?: number;
  })[];
  const socios    = (sociosRes?.data?.data ?? []) as User[];
  const historial = (historialRes?.data ?? []) as Mantenimiento[];

  // ── Stats ────────────────────────────────────────────────────
  const conDocsVencidos = vehiculos.filter((v) => (v.documentos_vencidos ?? 0) > 0).length;
  const altaKm          = vehiculos.filter((v) => (v.km_actual ?? 0) > 50000).length;

  return (
    <div className="p-6 max-w-5xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car size={18} className="text-primary-600" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Flota vehicular</h1>
            <p className="text-xs text-gray-400">Vehículos, documentos y mantenimiento</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary"
            onClick={() => setVista(vista === 'lista' ? 'mantenimiento' : 'lista')}
          >
            {vista === 'lista' ? <><History size={13} /> Mantenimientos</> : <><Car size={13} /> Vehículos</>}
          </Button>
          <Button size="sm" onClick={() => { resetV(); setModalVehiculo(true); }}>
            <Plus size={13} /> Nuevo vehículo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Vehículos activos"    value={vehiculos.length} />
        <StatCard label="Docs vencidos"        value={conDocsVencidos}
          subVariant={conDocsVencidos > 0 ? 'warn' : 'neutral'}
          sub={conDocsVencidos > 0 ? 'Requieren renovación' : 'Todo al día'} />
        <StatCard label="+50.000 km"           value={altaKm}
          subVariant={altaKm > 0 ? 'warn' : 'neutral'}
          sub={altaKm > 0 ? 'Revisar mantenimiento' : 'En rango normal'} />
      </div>

      {/* ── VISTA LISTA ─────────────────────────────────────────── */}
      {vista === 'lista' && (
        <Card padding={false}>
          {isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
          {!isLoading && vehiculos.length === 0 && (
            <EmptyState message="Sin vehículos registrados" icon="🚗" />
          )}
          {!isLoading && vehiculos.length > 0 && (
            <table className="table-base">
              <thead>
                <tr>
                  <th className="pl-4">Placa</th>
                  <th>Vehículo</th>
                  <th>Propietario</th>
                  <th>Km</th>
                  <th>Docs</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.map((v) => (
                  <tr key={v.id}>
                    <td className="pl-4 font-mono font-semibold text-gray-800">{v.placa}</td>
                    <td>
                      <p className="font-medium text-gray-800">{v.marca} {v.modelo}</p>
                      <p className="text-xs text-gray-400">{v.anio} · {v.color}</p>
                    </td>
                    <td className="text-gray-500">{(v as any).socio?.nombre ?? '—'}</td>
                    <td className="text-gray-500">
                      {v.km_actual ? `${v.km_actual.toLocaleString()} km` : '—'}
                    </td>
                    <td>
                      {(v.documentos_vencidos ?? 0) > 0
                        ? <Badge variant="red">{v.documentos_vencidos} vencido{v.documentos_vencidos !== 1 ? 's' : ''}</Badge>
                        : <Badge variant="green">Al día</Badge>}
                    </td>
                    <td>
                      <Button
                        size="xs" variant="secondary"
                        onClick={() => { setVehiculoSel(v); setVista('mantenimiento'); }}
                      >
                        <Wrench size={11} /> Mantenimiento
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* ── VISTA MANTENIMIENTO ──────────────────────────────────── */}
      {vista === 'mantenimiento' && (
        <div className="space-y-4">
          {/* Selector de vehículo */}
          <Card>
            <div className="flex items-center gap-3">
              <Select
                label="Vehículo"
                className="flex-1"
                value={vehiculoSel?.id ?? ''}
                onChange={(e) => {
                  const v = vehiculos.find((x) => x.id === e.target.value) ?? null;
                  setVehiculoSel(v);
                }}
              >
                <option value="">Selecciona un vehículo...</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} — {v.marca} {v.modelo} ({(v as any).socio?.nombre ?? '?'})
                  </option>
                ))}
              </Select>
              {vehiculoSel && (
                <Button
                  size="sm" className="mt-5"
                  onClick={() => { resetMant(); setModalMant(true); }}
                >
                  <Plus size={13} /> Registrar
                </Button>
              )}
            </div>
          </Card>

          {/* Historial del vehículo seleccionado */}
          {vehiculoSel && (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Historial — {vehiculoSel.placa}
                </p>
                <p className="text-xs text-gray-400">
                  Km actual: {vehiculoSel.km_actual?.toLocaleString() ?? '—'} km
                </p>
              </div>

              {loadHist && <div className="flex justify-center py-8"><Spinner /></div>}
              {!loadHist && historial.length === 0 && (
                <EmptyState message="Sin mantenimientos registrados" icon="🔧" />
              )}
              {!loadHist && historial.length > 0 && (
                <table className="table-base">
                  <thead>
                    <tr>
                      <th className="pl-4">Fecha</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Km actual</th>
                      <th>Próx. km</th>
                      <th>Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((m) => (
                      <tr key={m.id}>
                        <td className="pl-4 text-gray-500">
                          {m.fecha ? dayjs(m.fecha).format('DD/MM/YYYY') : '—'}
                        </td>
                        <td>
                          <Badge variant={
                            m.tipo === 'ACEITE'  ? 'amber' :
                            m.tipo === 'FRENOS'  ? 'red'   :
                            m.tipo === 'LLANTAS' ? 'blue'  : 'gray'
                          }>
                            {m.tipo}
                          </Badge>
                        </td>
                        <td className="text-gray-500 max-w-[180px] truncate">{m.descripcion ?? '—'}</td>
                        <td className="text-gray-500">
                          {m.km_actual ? `${m.km_actual.toLocaleString()} km` : '—'}
                        </td>
                        <td className="text-gray-500">
                          {m.km_proximo ? `${m.km_proximo.toLocaleString()} km` : '—'}
                        </td>
                        <td className="font-medium text-gray-800">
                          {m.costo ? `$${Number(m.costo).toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ── MODAL: Nuevo vehículo ─────────────────────────────────── */}
      <Modal
        open={modalVehiculo}
        onClose={() => setModalVehiculo(false)}
        title="Registrar nuevo vehículo"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalVehiculo(false)}>Cancelar</Button>
            <Button size="sm" loading={subV} onClick={hsV((d) => crearVehiculo.mutate(d))}>
              Registrar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select label="Propietario (socio)" error={errV.socio_id?.message} {...regV('socio_id', { required: true })}>
            <option value="">Selecciona un socio...</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </Select>
          <Input label="Placa" placeholder="ABC-1234" error={errV.placa?.message}
            {...regV('placa', { required: 'Campo obligatorio' })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Marca" placeholder="Toyota" {...regV('marca', { required: true })} />
            <Input label="Modelo" placeholder="Corolla" {...regV('modelo', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Año" type="number" {...regV('anio', { valueAsNumber: true })} />
            <Input label="Color" placeholder="Blanco" {...regV('color')} />
          </div>
        </div>
      </Modal>

      {/* ── MODAL: Registrar mantenimiento ───────────────────────── */}
      <Modal
        open={modalMant}
        onClose={() => setModalMant(false)}
        title={`Mantenimiento — ${vehiculoSel?.placa ?? ''}`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalMant(false)}>Cancelar</Button>
            <Button size="sm" loading={subM} onClick={hsM((d) => registrarMant.mutate(d))}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select label="Tipo de mantenimiento" {...regM('tipo')}>
            {TIPOS_MANT.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Descripción" placeholder="Ej: Cambio de aceite 5W30"
            {...regM('descripcion')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Km actual" type="number" placeholder="48500"
              {...regM('km_actual', { valueAsNumber: true })} />
            <Input label="Costo ($)" type="number" step="0.01" placeholder="35.00"
              {...regM('costo', { valueAsNumber: true })} />
          </div>
          <Input label="Fecha" type="date" {...regM('fecha')} />
          {vehiculoSel?.km_actual && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              Próximo mantenimiento sugerido: a los{' '}
              <strong>{(vehiculoSel.km_actual + 5000).toLocaleString()} km</strong>
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
