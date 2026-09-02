import { NavLink } from 'react-router-dom';
import { LockKeyhole, LogOut, Wrench, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import { useWorkshopProfile } from '@/features/workshop/hooks/use-workshop-profile';
import { getSidebarMenuRoutes } from '@/routes/route-manifest';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { billingService } from '@/features/billing/services/billing-service';
import type { BillingSubscription } from '@/features/billing/types';

const roleLabelMap: Record<string, string> = {
  ADMIN: 'Administrador',
  ATENDENTE: 'Atendente',
  MECANICO: 'Mecânico',
  FINANCEIRO: 'Financeiro',
};

const subscriptionStatusLabel: Record<BillingSubscription['status'], string> = {
  TRIALING: 'Período gratuito',
  ACTIVE: 'Assinatura ativa',
  PAST_DUE: 'Pagamento pendente',
  SUSPENDED: 'Assinatura suspensa',
  CANCELED: 'Assinatura cancelada',
  EXPIRED: 'Período encerrado',
  PILOT: 'Oficina piloto',
  LEGACY_FREE: 'Acesso legado',
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { role, session, logout } = useAuthState();
  const workshopQuery = useWorkshopProfile();
  const queryClient = useQueryClient();
  const subscriptionQuery = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: billingService.getSubscription,
    enabled: Boolean(session?.accessToken),
    staleTime: 60_000,
  });
  const menuItems = getSidebarMenuRoutes();
  const workshopName =
    workshopQuery.data?.tradeName ??
    session?.user.workshop?.tradeName ??
    session?.user.workshop?.name ??
    'AutoPro System';
  const profileName = role === 'ADMIN' ? workshopName : session?.user.name;
  const subscriptionLabel = subscriptionQuery.data?.plan?.name
    ? `Plano ${subscriptionQuery.data.plan.name}`
    : subscriptionQuery.data
      ? subscriptionStatusLabel[subscriptionQuery.data.status]
      : 'Assinatura';

  async function handleLogout() {
    await logout().catch(() => undefined);
    queryClient.clear();
  }

  return (
    <aside
      id="primary-navigation"
      aria-label="Navegação principal"
      className={cn(
        'surface-grid fixed inset-y-0 left-0 z-50 h-dvh w-[min(88vw,296px)] overflow-hidden border-r border-slate-800/60 bg-slate-950 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] text-slate-100 shadow-2xl transition-[transform,visibility] duration-300 ease-out lg:visible lg:sticky lg:top-0 lg:z-auto lg:w-auto lg:translate-x-0 lg:px-5 lg:py-6 lg:shadow-none',
        isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.2),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_24%)]" />
      <div className="relative flex h-full flex-col">
        <div className="mb-4 shrink-0 rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur sm:mb-6 sm:p-5 lg:mb-8">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_18px_44px_rgba(234,88,12,0.22)]">
              <Wrench className="size-7" />
            </div>
            <div className="min-w-0">
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {env.VITE_APP_NAME}
              </h1>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar menu"
              className="ml-auto shrink-0 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
              onClick={onClose}
            >
              <X className="size-5" />
            </Button>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-300 sm:text-sm">
            Produtividade operacional para negócios automotivos, Oficina
            Mecanica, Funilarias e Auto Elétricas
          </p>
        </div>
        <nav className="sidebar-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
          {menuItems.map((item) => {
            const isLocked =
              role !== 'ADMIN' && (!role || !item.roles.includes(role));

            return (
              <NavLink
                key={item.key}
                to={`/inicio/${item.path}`}
                aria-disabled={isLocked}
                title={
                  isLocked
                    ? 'Acesso restrito ao perfil administrador'
                    : undefined
                }
                onClick={(event) => {
                  if (isLocked) {
                    event.preventDefault();
                    return;
                  }
                  onClose?.();
                }}
                className={({ isActive }) =>
                  cn(
                    'group flex min-h-11 origin-left items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-1 hover:scale-[1.03] focus-visible:translate-x-1 focus-visible:scale-[1.03] sm:py-3',
                    isActive && !isLocked
                      ? 'border-orange-300/30 bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-[0_16px_32px_rgba(249,115,22,0.3)]'
                      : 'border-transparent text-slate-300 hover:border-white/25 hover:bg-white/14 hover:text-white hover:shadow-[0_12px_26px_rgba(255,255,255,0.08)]',
                    isLocked
                      ? 'cursor-not-allowed border-amber-300/20 text-slate-500 hover:translate-x-0 hover:scale-100 hover:border-amber-300/20 hover:bg-transparent hover:text-slate-500'
                      : null,
                  )
                }
              >
                {item.icon ? (
                  <item.icon
                    className={cn(
                      'size-4 transition-colors',
                      !isLocked ? 'group-hover:text-orange-200' : null,
                    )}
                  />
                ) : null}
                <span className="min-w-0 flex-1">{item.label}</span>
                {isLocked ? (
                  <LockKeyhole
                    className="size-3.5 text-amber-300"
                    aria-label="Acesso bloqueado"
                  />
                ) : null}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto shrink-0 pt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {profileName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {roleLabelMap[role ?? ''] ?? role}
                </p>
                <span className="rounded-full border border-orange-300/30 bg-orange-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-200">
                  {subscriptionLabel}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              aria-label="Sair"
              className="shrink-0 rounded-2xl border-white/10 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
