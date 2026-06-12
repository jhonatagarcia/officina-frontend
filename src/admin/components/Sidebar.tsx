import { FileText, Headphones, Home, LayoutDashboard, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/useAdminAuth';
import { useAdminLogSummary } from '../logs/useLogs';
import { useSupportSummary } from '../support/useSupport';
import { ThemeToggle } from '@/components/theme-toggle';

export function Sidebar() {
  const logout = useAdminAuth((state) => state.logout);
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
          <Home size={16} /> Oficinas
        </NavLink>
        <div className="admin-nav-label">Suporte</div>
        <NavLink to="/admin/support">
          <Headphones size={16} /> Chamados {activeTickets > 0 ? <span className="admin-badge">{activeTickets}</span> : null}
        </NavLink>
        <NavLink to="/admin/logs">
          <FileText size={16} /> Registros e Erros {criticalEvents > 0 ? <span className="admin-badge">{criticalEvents}</span> : null}
        </NavLink>
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
        <div className="admin-avatar">JH</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>Jhonata</strong>
          <br />
          <span>Administrador Master</span>
        </div>
        <ThemeToggle className="admin-theme-toggle" />
      </div>
    </aside>
  );
}
