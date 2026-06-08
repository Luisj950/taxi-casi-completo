import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui';
import type { UserPasajero } from '@/types';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await authApi.login(email, password);
      // Guardar token ANTES de llamar me() para que el interceptor lo envíe
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      const { data: me } = await authApi.me();
      setAuth(me as UserPasajero, data.access_token, data.refresh_token);
      navigate('/home', { replace: true });
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-600 to-brand-400 px-6">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 pb-4">
        <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center mb-5 shadow-xl">
          <span className="text-5xl">🚕</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">CoopTaxi</h1>
        <p className="text-white/70 text-sm">Tu cooperativa de taxis de confianza</p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-t-3xl px-6 pt-7 pb-10 shadow-2xl slide-up">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Iniciar sesión</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Correo</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com" autoComplete="email"
              className="w-full h-12 px-4 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Contraseña</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password"
              className="w-full h-12 px-4 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          {error && <p className="text-xs text-danger-600 bg-danger-50 px-3 py-2 rounded-xl">{error}</p>}
          <Button type="submit" fullWidth size="lg" loading={loading}>Entrar</Button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-5">
          ¿Primera vez?{' '}
          <Link to="/register" className="text-brand-600 font-medium">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
}
