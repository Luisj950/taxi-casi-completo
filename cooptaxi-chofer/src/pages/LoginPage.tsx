import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button, Spinner } from '@/components/ui';
import type { UserChofer } from '@/types';

export default function LoginPage() {
  const navigate  = useNavigate();
  const setAuth   = useAuthStore((s) => s.setAuth);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(email, password);
      if (!['CHOFER'].includes(data.user.rol)) {
        setError('Esta app es solo para conductores.');
        return;
      }
      // Guardar token ANTES de llamar me() para que el interceptor lo envíe
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      const { data: me } = await authApi.me();
      setAuth(me as UserChofer, data.access_token, data.refresh_token);
      navigate('/home', { replace: true });
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary-800 to-primary-600 px-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center mb-4 shadow-lg">
          <span className="text-white text-4xl">🚕</span>
        </div>
        <h1 className="text-2xl font-bold text-white">CoopTaxi</h1>
        <p className="text-white/60 text-sm mt-1">App del conductor</p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Iniciar sesión</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full h-11 px-4 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-danger-600 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
