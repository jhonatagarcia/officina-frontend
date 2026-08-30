import {
  Activity,
  FileText,
  Headphones,
  Home,
  LayoutDashboard,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/useAdminAuth';
import { useAdminLogSummary } from '../logs/useLogs';
import { useSupportSummary } from '../support/useSupport';
import { ThemeToggle } from '@/components/theme-toggle';

export function Sidebar() {
  const logout = useAdminAuth((state) => state.logout);
  const user = useAdminAuth((state) => state.user);
  const navigate = useNavigate();
  const supportSummary = useSupportSummary();
  const logSummary = useAdminLogSummary();
  const activeTickets = supportSummary.data?.active ?? 0;
  const criticalEvents = logSummary.data?.critical ?? 0;

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <strong>AutoPro</strong>
        <div>Painel Operacional</div>
      </div>
      <nav className="admin-nav">
        <div className="admin-nav-label">Principal</div>
        <NavLink to="/admin/dashboard">
          <LayoutDashboard size={16} /> Painel
        </NavLink>
        <NavLink to="/admin/tenants">
          <Home size={16} /> Negócios
        </NavLink>
        {user?.adminRole === 'SUPER_ADMIN' ? (
          <NavLink to="/admin/signup-invites">
            <UserPlus size={16} /> Convites
          </NavLink>
        ) : null}
        <div className="admin-nav-label">Suporte</div>
        <NavLink to="/admin/support">
          <Headphones size={16} /> Chamados{' '}
          {activeTickets > 0 ? (
            <span className="admin-badge">{activeTickets}</span>
          ) : null}
        </NavLink>
        <NavLink to="/admin/logs">
          <FileText size={16} /> Registros e Erros{' '}
          {criticalEvents > 0 ? (
            <span className="admin-badge">{criticalEvents}</span>
          ) : null}
        </NavLink>
        {user?.adminRole === 'SUPER_ADMIN' ? (
          <NavLink
            to="/admin/observability"
            data-testid="admin-observability-nav"
          >
            <Activity size={16} /> Observabilidade
          </NavLink>
        ) : null}
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/admin/login', { replace: true });
          }}
        >
          <LogOut size={16} /> Sair
        </button>
      </nav>
      <div className="admin-user">
        <div className="admin-avatar">{initials(user?.name ?? 'AM')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{user?.name ?? 'Admin Master'}</strong>
          <br />
          <span>Administrador Master</span>
        </div>
        <ThemeToggle className="admin-theme-toggle" />
      </div>
    </aside>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
