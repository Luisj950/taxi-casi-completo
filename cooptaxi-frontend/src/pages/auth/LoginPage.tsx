import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button, Input } from '@/components/ui';
import type { AuthResponse } from '@/types';

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  async function onSubmit({ email, password }: Form) {
    setError('');
    try {
      const { data } = await authApi.login(email, password);
      const body = data as AuthResponse;
      setAuth(body.user, body.access_token, body.refresh_token);
      navigate(['ADMIN', 'DESPACHADOR'].includes(body.user.rol) ? '/admin' : '/chofer');
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">CT</span>
          </div>
          <h1 className="text-xl font-semibold text-white">CoopTaxi</h1>
          <p className="text-sm text-white/60 mt-1">Sistema de gestión cooperativa</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Iniciar sesión</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <div className="text-xs text-danger-700 bg-danger-50 border border-danger-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          CoopTaxi © {new Date().getFullYear()} — Solo personal autorizado
        </p>
      </div>
    </div>
  );
}
