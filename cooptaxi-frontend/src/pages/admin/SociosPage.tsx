import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi, flotaApi } from '@/lib/api';
import {
  Card, Button, Badge, Input, Select, Modal,
  SectionTitle, EmptyState, Spinner,
} from '@/components/ui';
import { UserPlus, Search, Car } from 'lucide-react';
import type { User } from '@/types';

const userSchema = z.object({
  nombre:   z.string().min(3, 'Mínimo 3 caracteres'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  cedula:   z.string().length(10, 'Debe tener 10 dígitos').optional().or(z.literal('')),
  telefono: z.string().optional(),
  rol:      z.enum(['ADMIN','DESPACHADOR','CHOFER','PASAJERO','MECANICO']),
});
type UserForm = z.infer<typeof userSchema>;

const vehiculoSchema = z.object({
  placa:  z.string().min(3, 'Requerida'),
  marca:  z.string().min(2, 'Requerida'),
  modelo: z.string().min(1, 'Requerido'),
  anio:   z.coerce.number().min(1990).max(2030),
  color:  z.string().optional(),
  km_actual: z.coerce.number().min(0).optional(),
});
type VehiculoForm = z.infer<typeof vehiculoSchema>;

export default function SociosPage() {
  const qc = useQueryClient();
  const [search, setSearch]     = useState('');
  const [step, setStep]         = useState<'user' | 'vehiculo' | null>(null);
  const [editing, setEditing]   = useState<User | null>(null);
  const [nuevoId, setNuevoId]   = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn:  () => usersApi.list({ rol: 'CHOFER', limit: 100 }),
  });

  const userForm = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { rol: 'CHOFER' },
  });

  const vehiculoForm = useForm<VehiculoForm>({
    resolver: zodResolver(vehiculoSchema),
  });

  const create = useMutation({
    mutationFn: (d: UserForm) => usersApi.create(d),
    onSuccess: (res) => {
      setFormError('');
      qc.invalidateQueries({ queryKey: ['users-list'] });
      const creado = res.data as User;
      if (userForm.getValues('rol') === 'CHOFER') {
        setNuevoId(creado.id);
        setStep('vehiculo');
      } else {
        setStep(null);
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al crear el socio.'));
    },
  });

  const update = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<UserForm> }) => usersApi.update(id, d),
    onSuccess: () => { setFormError(''); qc.invalidateQueries({ queryKey: ['users-list'] }); setStep(null); },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar cambios.'));
    },
  });

  const crearVehiculo = useMutation({
    mutationFn: (d: VehiculoForm) => flotaApi.crear({ ...d, socio_id: nuevoId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users-list'] });
      setStep(null);
      setNuevoId(null);
      vehiculoForm.reset();
    },
  });

  const toggleEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      usersApi.setEstado(id, activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-list'] }),
  });

  function openCreate() {
    setEditing(null);
    setNuevoId(null);
    setFormError('');
    userForm.reset({ rol: 'CHOFER', nombre: '', email: '', password: '' });
    setStep('user');
  }

  function openEdit(u: User) {
    setEditing(u);
    setFormError('');
    userForm.reset({ nombre: u.nombre, email: u.email, rol: u.rol, cedula: u.cedula ?? '', telefono: u.telefono ?? '' });
    setStep('user');
  }

  function onUserSubmit(d: UserForm) {
    if (editing) {
      const payload = { ...d };
      if (!payload.password) delete payload.password;
      update.mutate({ id: editing.id, d: payload });
    } else {
      create.mutate(d);
    }
  }

  const socios = ((data?.data?.data ?? []) as User[])
    .filter((u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Socios</h1>
          <p className="text-xs text-gray-400">Conductores y personal</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <UserPlus size={14} /> Nuevo socio
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          placeholder="Buscar socio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card padding={false}>
        {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}
        {!isLoading && socios.length === 0 && <EmptyState message="No se encontraron socios" icon="👤" />}
        {!isLoading && socios.length > 0 && (
          <table className="table-base">
            <thead>
              <tr>
                <th className="pl-4">Nombre</th>
                <th>Cédula</th>
                <th>Placa</th>
                <th>Rating</th>
                <th>Cola</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {socios.map((u) => (
                <tr key={u.id}>
                  <td className="pl-4">
                    <p className="font-medium text-gray-800">{u.nombre}</p>
                    <p className="text-[11px] text-gray-400">{u.email}</p>
                  </td>
                  <td className="font-mono text-xs">{u.cedula ?? '—'}</td>
                  <td className="font-mono text-xs">{u.vehiculo?.placa ?? '—'}</td>
                  <td><span className="text-amber-400">★</span> {u.rating_promedio.toFixed(1)}</td>
                  <td className="text-gray-400">#{u.posicion_cola}</td>
                  <td>
                    {u.activo ? <Badge variant="green">Activo</Badge> : <Badge variant="red">Inactivo</Badge>}
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <Button size="xs" variant="ghost" onClick={() => openEdit(u)}>Editar</Button>
                      {u.rol === 'CHOFER' && !u.vehiculo && (
                        <Button size="xs" variant="ghost" onClick={() => { setNuevoId(u.id); setStep('vehiculo'); }}>
                          <Car size={11} /> Vehículo
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant={u.activo ? 'danger' : 'success'}
                        onClick={() => toggleEstado.mutate({ id: u.id, activo: !u.activo })}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Modal paso 1: datos del socio ── */}
      <Modal
        open={step === 'user'}
        onClose={() => { setStep(null); setEditing(null); }}
        title={editing ? 'Editar socio' : 'Nuevo socio'}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setStep(null); setEditing(null); }}>Cancelar</Button>
            <Button size="sm" loading={create.isPending || update.isPending} onClick={userForm.handleSubmit(onUserSubmit)}>
              {editing ? 'Guardar' : 'Crear socio →'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Nombre completo *" error={userForm.formState.errors.nombre?.message} {...userForm.register('nombre')} />
          <Input label="Email *" type="email" error={userForm.formState.errors.email?.message} {...userForm.register('email')} />
          <Input
            label={editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
            type="password"
            error={userForm.formState.errors.password?.message}
            {...userForm.register('password')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cédula (10 dígitos)" error={userForm.formState.errors.cedula?.message} {...userForm.register('cedula')} />
            <Input label="Teléfono" {...userForm.register('telefono')} />
          </div>
          <Select label="Rol" error={userForm.formState.errors.rol?.message} {...userForm.register('rol')}>
            <option value="CHOFER">Chofer</option>
            <option value="DESPACHADOR">Despachador</option>
            <option value="ADMIN">Admin</option>
            <option value="MECANICO">Mecánico</option>
          </Select>
          {!editing && userForm.watch('rol') === 'CHOFER' && (
            <p className="text-xs text-primary-600 bg-primary-50 px-3 py-2 rounded-lg">
              Al crear el chofer podrás registrar su vehículo en el siguiente paso.
            </p>
          )}
          {formError && (
            <p className="text-xs text-danger-700 bg-danger-50 border border-danger-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
        </div>
      </Modal>

      {/* ── Modal paso 2: vehículo del chofer ── */}
      <Modal
        open={step === 'vehiculo'}
        onClose={() => { setStep(null); setNuevoId(null); vehiculoForm.reset(); }}
        title="Registrar vehículo del chofer"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setStep(null); setNuevoId(null); vehiculoForm.reset(); }}>
              Omitir por ahora
            </Button>
            <Button size="sm" loading={crearVehiculo.isPending} onClick={vehiculoForm.handleSubmit((d) => crearVehiculo.mutate(d))}>
              <Car size={13} /> Registrar vehículo
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Placa *" placeholder="ABC-1234" error={vehiculoForm.formState.errors.placa?.message} {...vehiculoForm.register('placa')} />
            <Input label="Marca *" placeholder="Toyota" error={vehiculoForm.formState.errors.marca?.message} {...vehiculoForm.register('marca')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Modelo *" placeholder="Corolla" error={vehiculoForm.formState.errors.modelo?.message} {...vehiculoForm.register('modelo')} />
            <Input label="Año *" type="number" placeholder="2022" error={vehiculoForm.formState.errors.anio?.message} {...vehiculoForm.register('anio')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Color" placeholder="Blanco" {...vehiculoForm.register('color')} />
            <Input label="Km actual" type="number" placeholder="50000" {...vehiculoForm.register('km_actual')} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
