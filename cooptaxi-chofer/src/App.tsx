import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import LoginPage           from '@/pages/LoginPage';
import HomePage            from '@/pages/HomePage';
import CarreraIncomingPage from '@/pages/CarreraIncomingPage';
import EnRutaPage          from '@/pages/EnRutaPage';
import CompletadaPage      from '@/pages/CompletadaPage';

function Private({ children }: { children: React.ReactNode }) {
  const auth = useAuthStore((s) => s.isAuthenticated);
  return auth ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"             element={<LoginPage />} />
        <Route path="/"                  element={<Navigate to={isAuth ? '/home' : '/login'} replace />} />
        <Route path="/home"              element={<Private><HomePage /></Private>} />
        <Route path="/carrera-incoming"  element={<Private><CarreraIncomingPage /></Private>} />
        <Route path="/en-ruta"           element={<Private><EnRutaPage /></Private>} />
        <Route path="/completada"        element={<Private><CompletadaPage /></Private>} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
