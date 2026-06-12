import { toast } from 'sonner';
import type { CSSProperties } from 'react';
import { TopBar } from '../components/TopBar';
import { ticketStatusLabel } from '../lib/labels';
import { useSupportTickets, useUpdateTicketStatus } from './useSupport';

export default function SupportPage() {
  const tickets = useSupportTickets();
  const updateStatus = useUpdateTicketStatus();

  return (
    <>
      <TopBar title="Chamados de Suporte" />
      <section className="admin-content admin-grid">
        <div className="admin-grid admin-two">
          <Metric label="Chamados abertos" value={tickets.data?.filter((ticket) => ticket.status === 'OPEN').length ?? 0} color="#4db5ff" />
          <Metric label="Resolvidos este mes" value={tickets.data?.filter((ticket) => ticket.status === 'RESOLVED').length ?? 0} color="#35d05f" />
        </div>
        <section className="admin-card">
          <div className="admin-card-pad"><strong>Chamados de suporte</strong></div>
          {tickets.isLoading ? (
            <div className="admin-list-row">Carregando...</div>
          ) : (
            (tickets.data ?? []).map((ticket) => (
              <div className="admin-list-row" key={ticket.id}>
                <div>
                  <strong>{ticket.workshop.ownerName ?? ticket.workshop.tradeName}</strong>{' '}
                  <span className="admin-muted">{ticket.workshop.tradeName}</span>{' '}
                  <span className={`admin-pill ${ticket.status === 'OPEN' ? 'yellow' : ticket.status === 'PENDING' ? 'blue' : 'green'}`}>{ticketStatusLabel(ticket.status)}</span>
                  <div className="admin-muted">{ticket.subject}</div>
                  <div>{ticket.message}</div>
                </div>
                <button
                  className="admin-button secondary"
                  type="button"
                  onClick={() =>
                    updateStatus
                      .mutateAsync({ id: ticket.id, status: ticket.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED' })
                      .then(() => toast.success('Chamado atualizado'))
                  }
                >
                  {ticket.status === 'RESOLVED' ? 'Reabrir' : 'Resolver'}
                </button>
              </div>
            ))
          )}
        </section>
      </section>
    </>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <section className="admin-card admin-card-pad admin-kpi" style={{ '--accent-color': color } as CSSProperties}>
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value">{value}</div>
    </section>
  );
}
