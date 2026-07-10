import { NavLink } from 'react-router-dom';
import { LockKeyhole, LogOut, Wrench } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import { useWorkshopProfile } from '@/features/workshop/hooks/use-workshop-profile';
import { getSidebarMenuRoutes } from '@/routes/route-manifest';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const roleLabelMap: Record<string, string> = {
  ADMIN: 'Administrador',
  ATENDENTE: 'Atendente',
  MECANICO: 'Mecânico',
  FINANCEIRO: 'Financeiro',
};

export function Sidebar() {
  const { role, session, logout } = useAuthState();
  const workshopQuery = useWorkshopProfile();
  const queryClient = useQueryClient();
  const menuItems = getSidebarMenuRoutes();
  const workshopName = workshopQuery.data?.tradeName ?? session?.user.workshop?.tradeName ?? session?.user.workshop?.name ?? 'AutoPro System';
  const profileName = role === 'ADMIN' ? workshopName : session?.user.name;

  function handleLogout() {
    queryClient.clear();
    logout();
  }

  return (
    <aside className="surface-grid sticky top-0 h-screen overflow-hidden border-r border-slate-800/60 bg-slate-950 px-5 py-6 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.2),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_24%)]" />
      <div className="relative flex h-full flex-col">
        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_18px_44px_rgba(234,88,12,0.22)]">
              <Wrench className="size-7" />
            </div>
            <div className="min-w-0">
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">{env.VITE_APP_NAME}</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-300">Produtividade operacional para negócios automotivos, Oficina Mecanica, Funilarias e Auto Elétricas</p>
        </div>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isLocked = role !== 'ADMIN' && (!role || !item.roles.includes(role));

            return (
              <NavLink
                key={item.key}
                to={`/inicio/${item.path}`}
                aria-disabled={isLocked}
                title={isLocked ? 'Acesso restrito ao perfil administrador' : undefined}
                onClick={(event) => {
                  if (isLocked) {
                    event.preventDefault();
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    'group flex origin-left items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 hover:translate-x-1 hover:scale-[1.03] focus-visible:translate-x-1 focus-visible:scale-[1.03]',
                    isActive && !isLocked
                      ? 'border-orange-300/30 bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-[0_16px_32px_rgba(249,115,22,0.3)]'
                      : 'border-transparent text-slate-300 hover:border-white/25 hover:bg-white/14 hover:text-white hover:shadow-[0_12px_26px_rgba(255,255,255,0.08)]',
                    isLocked
                      ? 'cursor-not-allowed border-amber-300/20 text-slate-500 hover:translate-x-0 hover:scale-100 hover:border-amber-300/20 hover:bg-transparent hover:text-slate-500'
                      : null,
                  )
                }
              >
                {item.icon ? <item.icon className={cn('size-4 transition-colors', !isLocked ? 'group-hover:text-orange-200' : null)} /> : null}
                <span className="min-w-0 flex-1">{item.label}</span>
                {isLocked ? (
                  <LockKeyhole className="size-3.5 text-amber-300" aria-label="Acesso bloqueado" />
                ) : null}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto pt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{profileName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">{roleLabelMap[role ?? ''] ?? role}</p>
                <span className="rounded-full border border-orange-300/30 bg-orange-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-200">
                  Plano Pro
                </span>
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Sair" className="shrink-0 rounded-2xl border-white/10 bg-white/10 text-white hover:bg-white/15 hover:text-white">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
