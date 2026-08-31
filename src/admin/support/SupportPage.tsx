import { useEffect, useState, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { ticketStatusLabel } from '../lib/labels';
import {
  useReplyToTicket,
  useSupportSummary,
  useSupportTickets,
  useUpdateTicketStatus,
  type SupportTicket,
  type TicketStatus,
  type TicketType,
} from './useSupport';

const typeLabels: Record<TicketType, string> = {
  BUG: 'Bug (erro)',
  IMPROVEMENT: 'Melhoria',
  COMMENT: 'Comentário',
};

export default function SupportPage() {
  const tickets = useSupportTickets();
  const summary = useSupportSummary();
  const updateStatus = useUpdateTicketStatus();
  const replyToTicket = useReplyToTicket();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const selectedTicket =
    tickets.data?.find((ticket) => ticket.id === selectedId) ??
    tickets.data?.[0];

  useEffect(() => {
    if (!selectedId && tickets.data?.[0]) setSelectedId(tickets.data[0].id);
  }, [selectedId, tickets.data]);

  async function changeStatus(status: TicketStatus) {
    if (!selectedTicket) return;
    try {
      await updateStatus.mutateAsync({ id: selectedTicket.id, status });
      toast.success('Status do chamado atualizado.');
    } catch {
      toast.error('Não foi possível atualizar o chamado.');
    }
  }

  async function sendReply() {
    const message = reply.trim();
    if (!selectedTicket || message.length < 2) return;
    try {
      await replyToTicket.mutateAsync({ id: selectedTicket.id, message });
      setReply('');
      toast.success('Resposta enviada ao usuário.');
    } catch {
      toast.error('Não foi possível enviar a resposta.');
    }
  }

  return (
    <>
      <TopBar title="Chamados" />
      <section className="admin-content admin-grid">
        <div className="admin-support-kpis">
          <Metric
            label="Abertos"
            value={summary.data?.open ?? 0}
            color="#f1c400"
          />
          <Metric
            label="Aguardando usuário"
            value={summary.data?.pending ?? 0}
            color="#4db5ff"
          />
          <Metric
            label="Resolvidos"
            value={summary.data?.resolved ?? 0}
            color="#35d05f"
          />
        </div>

        <div className="admin-support-layout">
          <section className="admin-card admin-support-list">
            <div className="admin-card-pad">
              <strong>Conversas</strong>
              <div className="admin-muted">
                {tickets.data?.length ?? 0} chamados recentes
              </div>
            </div>
            {tickets.isLoading ? (
              <div className="admin-list-row">Carregando...</div>
            ) : null}
            {!tickets.isLoading && (tickets.data?.length ?? 0) === 0 ? (
              <div className="admin-list-row admin-muted">
                Nenhum chamado recebido.
              </div>
            ) : null}
            {(tickets.data ?? []).map((ticket) => (
              <button
                type="button"
                className={`admin-support-list-item ${selectedTicket?.id === ticket.id ? 'active' : ''}`}
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
              >
                <div className="admin-support-list-head">
                  <strong>
                    {ticket.workshop.ownerName ?? ticket.workshop.tradeName}
                  </strong>
                  <TicketStatusPill status={ticket.status} />
                </div>
                <span className="admin-muted">
                  {typeLabels[ticket.type]} · {ticket.workshop.tradeName}
                </span>
                <span>{ticket.subject}</span>
                <small>{formatDate(ticket.updatedAt)}</small>
              </button>
            ))}
          </section>

          {selectedTicket ? (
            <TicketConversation
              ticket={selectedTicket}
              reply={reply}
              onReplyChange={setReply}
              onSendReply={sendReply}
              onChangeStatus={changeStatus}
              isWorking={replyToTicket.isPending || updateStatus.isPending}
            />
          ) : (
            <section className="admin-card admin-card-pad admin-muted">
              Selecione um chamado para ver a conversa.
            </section>
          )}
        </div>
      </section>
    </>
  );
}

function TicketConversation({
  ticket,
  reply,
  onReplyChange,
  onSendReply,
  onChangeStatus,
  isWorking,
}: {
  ticket: SupportTicket;
  reply: string;
  onReplyChange: (value: string) => void;
  onSendReply: () => void;
  onChangeStatus: (status: TicketStatus) => void;
  isWorking: boolean;
}) {
  return (
    <section className="admin-card admin-support-conversation">
      <header className="admin-support-conversation-head">
        <div>
          <div className="admin-support-eyebrow">
            {typeLabels[ticket.type]}
            {ticket.rating ? ` · ${'★'.repeat(ticket.rating)}` : ''}
          </div>
          <h2>{ticket.subject}</h2>
          <div className="admin-muted">
            {ticket.workshop.ownerName ?? ticket.workshop.tradeName} ·{' '}
            {ticket.workshop.email ?? 'E-mail não informado'}
          </div>
        </div>
        <TicketStatusPill status={ticket.status} />
      </header>

      <div className="admin-support-messages">
        {ticket.messages.map((message) => (
          <div
            key={message.id}
            className={`admin-support-message ${message.authorType === 'MASTER' ? 'master' : 'user'}`}
          >
            <div>
              <strong>
                {message.authorType === 'MASTER'
                  ? 'Suporte master'
                  : message.authorName}
              </strong>
              <span>{formatDate(message.createdAt)}</span>
            </div>
            <p>{message.body}</p>
          </div>
        ))}
      </div>

      <div className="admin-support-reply">
        <textarea
          value={reply}
          onChange={(event) => onReplyChange(event.target.value)}
          placeholder="Escreva uma resposta para o usuário..."
          maxLength={2000}
        />
        <div className="admin-support-actions">
          <div>
            {ticket.status !== 'OPEN' ? (
              <button
                className="admin-button secondary"
                type="button"
                disabled={isWorking}
                onClick={() => onChangeStatus('OPEN')}
              >
                Reabrir
              </button>
            ) : null}
            {ticket.status !== 'RESOLVED' ? (
              <button
                className="admin-button secondary"
                type="button"
                disabled={isWorking}
                onClick={() => onChangeStatus('RESOLVED')}
              >
                Marcar resolvido
              </button>
            ) : null}
          </div>
          <button
            className="admin-button"
            type="button"
            disabled={reply.trim().length < 2 || isWorking}
            onClick={onSendReply}
          >
            <Send size={14} /> Responder
          </button>
        </div>
      </div>
    </section>
  );
}

function TicketStatusPill({ status }: { status: TicketStatus }) {
  const color =
    status === 'OPEN' ? 'yellow' : status === 'PENDING' ? 'blue' : 'green';
  return (
    <span className={`admin-pill ${color}`}>{ticketStatusLabel(status)}</span>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <section
      className="admin-card admin-card-pad admin-kpi"
      style={{ '--accent-color': color } as CSSProperties}
    >
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value">{value}</div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
