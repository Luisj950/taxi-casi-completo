import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore }   from '@/store/auth.store';
import { useCarreraStore } from '@/store/carrera.store';
import LoginPage    from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import HomePage     from '@/pages/HomePage';
import EsperandoPage from '@/pages/EsperandoPage';
import EnRutaPage   from '@/pages/EnRutaPage';
import CalificarPage from '@/pages/CalificarPage';

function Private({ children }: { children: React.ReactNode }) {
  const auth = useAuthStore((s) => s.isAuthenticated);
  return auth ? <>{children}</> : <Navigate to="/login" replace />;
}

// Redirige automáticamente según el estado de la carrera activa
function SmartHome() {
  const { carrera, paraCalificar } = useCarreraStore();
  if (paraCalificar)                return <Navigate to="/calificar" replace />;
  if (carrera?.estado === 'EN_RUTA' || carrera?.estado === 'ASIGNADA')
                                    return <Navigate to="/en-ruta" replace />;
  if (carrera?.estado === 'PENDIENTE') return <Navigate to="/esperando" replace />;
  return <HomePage />;
}

export default function App() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/"         element={<Navigate to={isAuth ? '/home' : '/login'} replace />} />

        <Route path="/home"      element={<Private><SmartHome /></Private>} />
        <Route path="/esperando" element={<Private><EsperandoPage /></Private>} />
        <Route path="/en-ruta"   element={<Private><EnRutaPage /></Private>} />
        <Route path="/calificar" element={<Private><CalificarPage /></Private>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
