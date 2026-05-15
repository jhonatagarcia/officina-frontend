import { NavLink } from 'react-router-dom';
import { LockKeyhole, Wrench } from 'lucide-react';
import { env } from '@/lib/env';
import { useAuthState } from '@/features/auth/hooks/use-auth-state';
import { getSidebarRoutes } from '@/routes/route-manifest';
import { cn } from '@/lib/utils';
import { useWorkshopFiscalStatus } from '@/features/workshop/hooks/use-workshop-fiscal-status';

export function Sidebar() {
  const { role } = useAuthState();
  const fiscalStatus = useWorkshopFiscalStatus();
  const menuItems = getSidebarRoutes(role);

  return (
    <aside className="surface-grid relative border-r border-slate-800/60 bg-slate-950 px-5 py-6 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.2),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_24%)]" />
      <div className="relative">
        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_18px_44px_rgba(234,88,12,0.22)]">
              <Wrench className="size-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">ERP Oficina</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">{env.VITE_APP_NAME}</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-300">Produtividade operacional para oficina mecânica.</p>
        </div>
        <nav className="space-y-2">
          {menuItems.map((item) => (
              <NavLink
                key={item.key}
                to={`/app/${item.path}`}
                title={item.requiresCnpj && fiscalStatus.isIncomplete ? 'Exige CNPJ da oficina cadastrado' : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex origin-left items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 hover:translate-x-1 hover:scale-[1.03] focus-visible:translate-x-1 focus-visible:scale-[1.03]',
                    isActive
                      ? 'border-orange-300/30 bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-[0_16px_32px_rgba(249,115,22,0.3)]'
                      : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/6 hover:text-white',
                    item.requiresCnpj && fiscalStatus.isIncomplete ? 'border-amber-300/20 text-slate-300' : null,
                  )
                }
              >
                {item.icon ? <item.icon className="size-4" /> : null}
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.requiresCnpj && fiscalStatus.isIncomplete ? (
                  <LockKeyhole className="size-3.5 text-amber-300" aria-label="Exige CNPJ" />
                ) : null}
              </NavLink>
            ))}
        </nav>
      </div>
    </aside>
  );
}
