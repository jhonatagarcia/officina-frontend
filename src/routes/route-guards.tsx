import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import type { Role } from '@/types/auth';
import { UnauthorizedPage } from '@/components/shared/unauthorized-state';

export function ProtectedRoute() {
  const { isAuthenticated, hydrated } = useAuthState();
  const location = useLocation();

  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated } = useAuthState();

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
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
