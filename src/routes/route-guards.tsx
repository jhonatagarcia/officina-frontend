import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import { useAdminAuth } from '@/admin/auth/useAdminAuth';
import type { Role } from '@/types/auth';
import { UnauthorizedPage } from '@/components/shared/unauthorized-state';

export function ProtectedRoute() {
  const { isAuthenticated, hydrated } = useAuthState();
  const adminToken = useAdminAuth((s) => s.token);
  const location = useLocation();

  if (!hydrated) return null;

  // Admin logado sem sessão de tenant → área incorreta, redireciona silenciosamente
  if (!isAuthenticated && adminToken) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, hydrated } = useAuthState();

  if (hydrated && isAuthenticated) {
    return <Navigate to="/inicio/dashboard" replace />;
  }

  return <Outlet />;
}

export function RoleGuard({ roles }: { roles: Role[] }) {
  const { role } = useAuthState();

  if (!role || !roles.includes(role)) {
    return <UnauthorizedPage />;
  }

  return <Outlet />;
}
