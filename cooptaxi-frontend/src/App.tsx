import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import LoginPage        from '@/pages/auth/LoginPage';
import AdminLayout      from '@/components/layout/AdminLayout';
import DashboardPage    from '@/pages/admin/DashboardPage';
import SociosPage       from '@/pages/admin/SociosPage';
import FlotaPage        from '@/pages/admin/FlotaPage';
import DocumentosPage   from '@/pages/admin/DocumentosPage';
import FinanzasPage     from '@/pages/admin/FinanzasPage';
import IncidentesPage   from '@/pages/admin/IncidentesPage';
import ReportesPage     from '@/pages/admin/ReportesPage';
import DespachoPage     from '@/pages/despacho/DespachoPage';
import AltaDemandaPage  from '@/pages/despacho/AltaDemandaPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to={user ? '/admin' : '/login'} replace />} />
        <Route path="/" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route path="admin"                    element={<DashboardPage />} />
          <Route path="admin/socios"             element={<SociosPage />} />
          <Route path="admin/flota"              element={<FlotaPage />} />
          <Route path="admin/documentos"         element={<DocumentosPage />} />
          <Route path="admin/finanzas"           element={<FinanzasPage />} />
          <Route path="admin/incidentes"         element={<IncidentesPage />} />
          <Route path="admin/reportes"           element={<ReportesPage />} />
          <Route path="despacho"                 element={<DespachoPage />} />
          <Route path="despacho/alta-demanda"    element={<AltaDemandaPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
