import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui';
import type { UserPasajero } from '@/types';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [form, setForm]     = useState({ nombre: '', email: '', password: '', telefono: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    setLoading(true); setError('');
    try {
      await authApi.register(form);
      const { data } = await authApi.login(form.email, form.password);
      const { data: me } = await authApi.me();
      setAuth(me as UserPasajero, data.access_token, data.refresh_token);
      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al crear la cuenta. El correo ya existe.');
    } finally { setLoading(false); }
  }

  const field = (label: string, k: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">
        {label}{k !== 'telefono' && <span className="text-danger-400"> *</span>}
      </label>
      <input
        type={type} value={form[k]} onChange={set(k)} placeholder={placeholder}
        className="w-full h-12 px-4 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-600 to-brand-400 px-6">
      <div className="flex items-center justify-center pt-12 pb-6">
        <div className="text-center">
          <span className="text-4xl">🚕</span>
          <h1 className="text-2xl font-bold text-white mt-2">CoopTaxi</h1>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl px-6 pt-7 pb-10 shadow-2xl flex-1 slide-up">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Crear cuenta</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          {field('Nombre completo', 'nombre', 'text', 'Tu nombre')}
          {field('Correo electrónico', 'email', 'email', 'tu@correo.com')}
          {field('Contraseña', 'password', 'password', '8 caracteres mínimo')}
          {field('Teléfono (opcional)', 'telefono', 'tel', '0987654321')}
          {error && <p className="text-xs text-danger-600 bg-danger-50 px-3 py-2 rounded-xl">{error}</p>}
          <Button type="submit" fullWidth size="lg" loading={loading}>Crear cuenta</Button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand-600 font-medium">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
