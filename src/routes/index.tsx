import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingState } from '@/components/shared/loading-state';
import { GuestRoute, ProtectedRoute, RoleGuard } from '@/routes/route-guards';
import { LoginPage } from '@/features/auth/pages/login-page';
import { appRoutes } from '@/routes/route-manifest';

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            {appRoutes.map((route) => (
              <Route key={route.key} element={<RoleGuard roles={route.roles} />}>
                <Route path={route.path} element={route.element} />
              </Route>
            ))}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
