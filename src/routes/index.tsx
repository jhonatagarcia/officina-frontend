import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingState } from '@/components/shared/loading-state';
import { GuestRoute, ProtectedRoute, RoleGuard } from '@/routes/route-guards';
import { LoginPage } from '@/features/auth/pages/login-page';
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page';
import { appRoutes } from '@/routes/route-manifest';
import { env } from '@/lib/env';
import AdminApp from '@/admin/AdminApp';

const LandingPage = lazy(() =>
  import('@/features/landing/pages/landing-page').then((m) => ({ default: m.LandingPage }))
);

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        {/* ── PÚBLICO ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── ADMIN ── */}
        {env.VITE_ADMIN_PANEL_ENABLED ? (
          <Route path="/admin/*" element={<AdminApp />} />
        ) : null}

        {/* ── AUTH (guest only) ── */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ── TENANT APP ── */}
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
