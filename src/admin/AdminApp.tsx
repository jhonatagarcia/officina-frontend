import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import AdminLoginPage from './auth/AdminLoginPage';
import { useAdminAuth } from './auth/useAdminAuth';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from './components/Sidebar';
import DashboardPage from './dashboard/DashboardPage';
import LogsPage from './logs/LogsPage';
import ObservabilityPage from './observability/ObservabilityPage';
import SupportPage from './support/SupportPage';
import TenantsPage from './tenants/TenantsPage';
import SignupInvitesPage from './signup-invites/SignupInvitesPage';
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
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  useEffect(() => {
    if (!isNavigationOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isNavigationOpen]);

  return (
    <RequireAdminAuth>
      <div className="admin-shell">
        <Sidebar
          isOpen={isNavigationOpen}
          onClose={() => setIsNavigationOpen(false)}
        />
        {isNavigationOpen ? (
          <button
            type="button"
            className="admin-navigation-backdrop"
            aria-label="Fechar menu administrativo"
            onClick={() => setIsNavigationOpen(false)}
          />
        ) : null}
        <main className="admin-main">
          <div className="admin-mobile-header">
            <button
              type="button"
              aria-label="Abrir menu administrativo"
              aria-controls="admin-navigation"
              onClick={() => setIsNavigationOpen(true)}
            >
              <Menu size={20} />
            </button>
            <strong>AutoPro</strong>
            <span>Painel Operacional</span>
          </div>
          <Routes>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="signup-invites" element={<SignupInvitesPage />} />
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
