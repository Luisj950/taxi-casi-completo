import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '@/lib/api';
import {
  Card, Button, Badge, Input, Select, Modal,
  SectionTitle, EmptyState, Spinner,
} from '@/components/ui';
import { UserPlus, Search } from 'lucide-react';
import type { User } from '@/types';

const schema = z.object({
  nombre:   z.string().min(3),
  email:    z.string().email(),
  password: z.string().min(8).optional().or(z.literal('')),
  cedula:   z.string().length(10).optional().or(z.literal('')),
  telefono: z.string().optional(),
  rol:      z.enum(['ADMIN','DESPACHADOR','CHOFER','PASAJERO','MECANICO']),
});
type Form = z.infer<typeof schema>;

export default function SociosPage() {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [openModal, setModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn:  () => usersApi.list({ rol: 'CHOFER', limit: 100 }),
  });

  const create = useMutation({
    mutationFn: (d: Form) => usersApi.create(d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['users-list'] }); setModal(false); },
  });

  const update = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<Form> }) => usersApi.update(id, d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['users-list'] }); setModal(false); },
  });

  const toggleEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      usersApi.setEstado(id, activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-list'] }),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { rol: 'CHOFER' },
  });

  function openCreate() {
    setEditing(null);
    reset({ rol: 'CHOFER', nombre: '', email: '', password: '' });
    setModal(true);
  }
  function openEdit(u: User) {
    setEditing(u);
    reset({ nombre: u.nombre, email: u.email, rol: u.rol, cedula: u.cedula, telefono: u.telefono });
    setModal(true);
  }

  function onSubmit(d: Form) {
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
          <p className="text-xs text-gray-400">Gestión de conductores y personal</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <UserPlus size={14} /> Nuevo socio
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          placeholder="Buscar socio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <Card padding={false}>
        {isLoading && (
          <div className="flex justify-center py-12"><Spinner /></div>
        )}
        {!isLoading && socios.length === 0 && (
          <EmptyState message="No se encontraron socios" icon="👤" />
        )}
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
                  <td>
                    <span className="text-amber-400">★</span> {u.rating_promedio.toFixed(1)}
                  </td>
                  <td className="text-gray-400">#{u.posicion_cola}</td>
                  <td>
                    {u.activo
                      ? <Badge variant="green">Activo</Badge>
                      : <Badge variant="red">Inactivo</Badge>}
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <Button size="xs" variant="ghost" onClick={() => openEdit(u)}>
                        Editar
                      </Button>
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

      {/* Modal crear/editar */}
      <Modal
        open={openModal}
        onClose={() => setModal(false)}
        title={editing ? 'Editar socio' : 'Nuevo socio'}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModal(false)}>Cancelar</Button>
            <Button size="sm" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {editing ? 'Guardar cambios' : 'Crear socio'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Nombre completo" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input
            label={editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cédula" error={errors.cedula?.message} {...register('cedula')} />
            <Input label="Teléfono" {...register('telefono')} />
          </div>
          <Select label="Rol" error={errors.rol?.message} {...register('rol')}>
            <option value="CHOFER">Chofer</option>
            <option value="DESPACHADOR">Despachador</option>
            <option value="ADMIN">Admin</option>
            <option value="MECANICO">Mecánico</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}
