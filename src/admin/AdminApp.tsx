import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import AdminLoginPage from './auth/AdminLoginPage';
import { useAdminAuth } from './auth/useAdminAuth';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from './components/Sidebar';
import DashboardPage from './dashboard/DashboardPage';
import LogsPage from './logs/LogsPage';
import ObservabilityPage from './observability/ObservabilityPage';
import SupportPage from './support/SupportPage';
import TenantsPage from './tenants/TenantsPage';
import './admin.css';

function RequireAdminAuth({ children }: { children: ReactNode }) {
  const adminToken = useAdminAuth((state) => state.token);
  const adminUser = useAdminAuth((state) => state.user);
  const tenantSession = useAuthStore((state) => state.session);

  // Tenant logado sem token admin → redireciona para área correta silenciosamente
  if (!adminToken && tenantSession?.accessToken) {
    return <Navigate to="/inicio/dashboard" replace />;
  }

  if (!adminToken || adminUser?.adminRole !== 'SUPER_ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function AdminLayout() {
  return (
    <RequireAdminAuth>
      <div className="admin-shell">
        <Sidebar />
        <main className="admin-main">
          <Routes>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="observability" element={<ObservabilityPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </RequireAdminAuth>
  );
}

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route path="*" element={<AdminLayout />} />
    </Routes>
  );
}
