import { useState } from 'react';
import type { CSSProperties } from 'react';
import { TopBar } from '../components/TopBar';
import { logCategoryLabel, logLevelLabel } from '../lib/labels';
import type { AdminLog } from './useLogs';
import { useAdminLogs, useAdminLogSummary } from './useLogs';

export default function LogsPage() {
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const logs = useAdminLogs(level, category);
  const summary = useAdminLogSummary();
  const logData = logs.data ?? [];
  const lastLog = summary.data?.latest ?? logData[0];
  const lastLogTime = lastLog
    ? new Date(lastLog.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '-';

  return (
    <>
      <TopBar title="Registros e Erros" />
      <section className="admin-content admin-grid">
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          <Metric label="Eventos 24h" value={summary.data?.recent ?? logData.length} color="#4db5ff" />
          <Metric label="Erros 24h" value={summary.data?.errors ?? logData.filter((log) => log.level === 'ERROR').length} color="#ff3f67" />
          <Metric label="Seguranca 24h" value={summary.data?.security ?? logData.filter((log) => log.category === 'SECURITY').length} color="#f1c400" />
          <Metric label="Ultimo registro" value={lastLogTime} color="#35d05f" />
        </div>

        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {/* TODO(WhatsApp Cloud API): restaurar a metrica de mensagens depois do rollout. */}
          <Metric label="Redis 24h" value={summary.data?.redis ?? 0} color="#ff7425" />
          <Metric label="Filas 24h" value={summary.data?.queue ?? 0} color="#35d05f" />
        </div>

        <section className="admin-card">
          <div className="admin-card-pad admin-log-toolbar">
            <strong>Registros recentes</strong>
            <div className="admin-controls">
              <select className="admin-select" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Todas categorias</option>
                <option value="SECURITY">Seguranca</option>
                <option value="HTTP">API</option>
                {/* TODO(WhatsApp Cloud API): restaurar o filtro de logs depois do rollout. */}
                <option value="REDIS">Redis</option>
                <option value="QUEUE">Fila</option>
                <option value="AUTH">Autenticacao</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select className="admin-select" value={level} onChange={(event) => setLevel(event.target.value)}>
                <option value="">Todos niveis</option>
                <option value="ERROR">Erro</option>
                <option value="WARN">Alerta</option>
                <option value="INFO">Informacao</option>
              </select>
            </div>
          </div>
          {logs.isLoading ? (
            <div className="admin-list-row">Carregando...</div>
          ) : logData.length === 0 ? (
            <div className="admin-list-row">Nenhum evento registrado.</div>
          ) : null}
          {logData.map((log) => (
            <div className="admin-list-row" key={`${log.createdAt}-${log.message}`}>
              <div>
                <span className={`admin-pill ${levelColor(log.level)}`}>{logLevelLabel(log.level)}</span>{' '}
                <span className={`admin-pill ${categoryColor(log.category)}`}>{logCategoryLabel(log.category)}</span>{' '}
                {log.message}
                <div className="admin-muted">
                  {[
                    log.source ? `Origem: ${log.source}` : null,
                    log.adminEmail ? `Admin: ${log.adminEmail}` : null,
                    log.method && log.path ? `${log.method} ${log.path}` : null,
                    log.statusCode ? `HTTP ${log.statusCode}` : null,
                    log.ipAddress ? `IP ${log.ipAddress}` : null,
                  ].filter(Boolean).join(' - ')}
                </div>
              </div>
              <span className="admin-muted">{formatDateTime(log.createdAt)}</span>
            </div>
          ))}
        </section>
      </section>
    </>
  );
}

function levelColor(level: AdminLog['level']) {
  return level === 'ERROR' ? 'red' : level === 'WARN' ? 'yellow' : 'blue';
}

function categoryColor(category: AdminLog['category']) {
  return category === 'SECURITY' || category === 'HTTP'
    ? 'red'
    : category === 'REDIS' || category === 'QUEUE'
      ? 'yellow'
      : 'blue';
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function Metric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <section className="admin-card admin-card-pad admin-kpi" style={{ '--accent-color': color } as CSSProperties}>
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value">{value}</div>
    </section>
  );
}
