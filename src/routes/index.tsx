import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingState } from '@/components/shared/loading-state';
import { GuestRoute, ProtectedRoute, RoleGuard } from '@/routes/route-guards';
import { LoginPage } from '@/features/auth/pages/login-page';
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page';
import { LandingPage } from '@/features/landing/pages/landing-page';
import { appRoutes } from '@/routes/route-manifest';
import { env } from '@/lib/env';

const AdminApp = lazy(() =>
  import('@/admin/AdminApp').then((module) => ({ default: module.default })),
);

function LegacyAppRedirect() {
  const location = useLocation();
  const nextPath = location.pathname.replace(/^\/app\b/, '/inicio');

  return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />;
}

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
        <Route path="/app/*" element={<LegacyAppRedirect />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/inicio" element={<AppLayout />}>
            <Route index element={<Navigate to="/inicio/dashboard" replace />} />
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
