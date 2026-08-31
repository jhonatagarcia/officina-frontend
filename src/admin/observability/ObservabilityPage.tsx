import type { ReactNode } from 'react';
import { KpiCard } from '../components/KpiCard';
import { TopBar } from '../components/TopBar';
import type {
  ObservabilityCounter,
  ObservabilityDomainEvent,
  ObservabilityHttpCounter,
  ObservabilityLatency,
} from './useObservability';
import { useObservabilitySnapshot } from './useObservability';

export default function ObservabilityPage() {
  const snapshot = useObservabilitySnapshot();
  const data = snapshot.data;
  const isEmpty =
    data &&
    data.http.byRoute.length === 0 &&
    data.http.byStatusFamily.length === 0 &&
    data.latency.routes.length === 0 &&
    data.errors.byCategory.length === 0 &&
    data.financial.events.length === 0 &&
    data.authSecurity.events.length === 0;

  return (
    <>
      <TopBar title="Observabilidade" />
      <section
        className="admin-content admin-grid"
        data-testid="admin-observability-page"
      >
        <div
          className="admin-card admin-card-pad"
          data-testid="observability-scope-note"
        >
          <strong>Dados do processo atual, sem retenção persistente</strong>
          <div className="admin-muted">
            O snapshot é sanitizado, agregado em memória e não concede acesso
            operacional a dados de tenants.
          </div>
        </div>

        {snapshot.isLoading ? (
          <SafeState testId="observability-loading">
            Carregando observabilidade...
          </SafeState>
        ) : snapshot.isError ? (
          <SafeState testId="observability-error">
            Não foi possível carregar o snapshot sanitizado.
          </SafeState>
        ) : data ? (
          <>
            <div className="admin-grid admin-kpis">
              <KpiCard
                label="Liveness"
                value={healthLabel(data.health.liveness.status)}
                hint={`${data.health.liveness.checks} checks`}
                color="#35d05f"
              />
              <KpiCard
                label="Readiness"
                value={healthLabel(data.health.readiness.status)}
                hint={data.health.readiness.dependencies
                  .map(
                    (item) => `${item.dependency}: ${healthLabel(item.status)}`,
                  )
                  .join(' | ')}
                color={
                  data.health.readiness.status === 'not_ready'
                    ? '#ff3f67'
                    : '#4db5ff'
                }
                negative={data.health.readiness.status === 'not_ready'}
              />
              <KpiCard
                label="HTTP"
                value={String(sumCounters(data.http.byStatusFamily))}
                hint="requisições agregadas"
                color="#ff7425"
              />
              <KpiCard
                label="Erros"
                value={String(sumCounters(data.errors.byCategory))}
                hint="categorias seguras"
                color="#ff3f67"
                negative
              />
              <KpiCard
                label="Latência p95"
                value={`${maxLatency(data.latency.routes, 'p95Ms')} ms`}
                hint="maior rota observada"
                color="#a472f7"
              />
              <KpiCard
                label="Filas futuras"
                value="Inativo"
                hint="Redis/BullMQ não ativo"
                color="#f1c400"
              />
            </div>

            {isEmpty ? (
              <SafeState testId="observability-empty">
                Nenhum agregado operacional disponível neste processo.
              </SafeState>
            ) : null}

            <section
              className="admin-card admin-card-pad"
              data-testid="observability-retention"
            >
              <strong>Escopo e limites</strong>
              <div className="admin-muted">{data.source.retentionNote}</div>
              <div className="admin-grid admin-two" style={{ marginTop: 16 }}>
                <MiniMetric
                  label="Contadores"
                  value={`${data.aggregation.current.counterKeys}/${data.aggregation.limits.maxCounterKeys}`}
                />
                <MiniMetric
                  label="Rotas com latência"
                  value={`${data.aggregation.current.latencyKeys}/${data.aggregation.limits.maxLatencyKeys}`}
                />
                <MiniMetric
                  label="Eventos recentes internos"
                  value={`${data.aggregation.current.recentEventBufferSize}/${data.aggregation.limits.maxRecentEvents}`}
                />
                <MiniMetric
                  label="Amostras por rota"
                  value={data.aggregation.limits.maxLatencySamplesPerKey}
                />
              </div>
            </section>

            <DataSection title="HTTP por status">
              <CounterTable
                rows={data.http.byStatusFamily}
                empty="Sem contadores HTTP."
              />
            </DataSection>
            <DataSection title="HTTP por rota">
              <HttpTable
                rows={data.http.byRoute}
                empty="Sem rotas HTTP agregadas."
              />
            </DataSection>
            <DataSection title="Latência">
              <LatencyTable rows={data.latency.routes} />
            </DataSection>
            <DataSection title="Erros por categoria segura">
              <CounterTable
                rows={data.errors.byCategory}
                empty="Sem erros agregados."
              />
            </DataSection>
            <DataSection title="Financeiro">
              <DomainEventTable
                rows={data.financial.events}
                empty="Sem falhas financeiras agregadas."
              />
            </DataSection>
            <DataSection title="Autenticação e segurança">
              <DomainEventTable
                rows={data.authSecurity.events}
                empty="Sem eventos agregados."
              />
            </DataSection>
          </>
        ) : null}
      </section>
    </>
  );
}

function DataSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-card admin-card-pad">
      <strong>{title}</strong>
      {children}
    </section>
  );
}

function SafeState({
  testId,
  children,
}: {
  testId: string;
  children: ReactNode;
}) {
  return (
    <section
      className="admin-card admin-card-pad admin-muted"
      data-testid={testId}
    >
      {children}
    </section>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="admin-list-row">
      <span className="admin-muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CounterTable({
  rows,
  empty,
}: {
  rows: ObservabilityCounter[];
  empty: string;
}) {
  if (rows.length === 0)
    return <div className="admin-list-row admin-muted">{empty}</div>;

  return (
    <table className="admin-table" data-testid="observability-counter-table">
      <thead>
        <tr>
          <th>Categoria</th>
          <th>Contagem</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            <td>{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HttpTable({
  rows,
  empty,
}: {
  rows: ObservabilityHttpCounter[];
  empty: string;
}) {
  if (rows.length === 0)
    return <div className="admin-list-row admin-muted">{empty}</div>;

  return (
    <table className="admin-table" data-testid="observability-http-table">
      <thead>
        <tr>
          <th>Rota</th>
          <th>Método</th>
          <th>Status</th>
          <th>Erro</th>
          <th>Contagem</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={`${row.method}-${row.routeTemplate}-${row.statusCodeFamily}-${row.errorCategory}`}
          >
            <td>{row.routeTemplate}</td>
            <td>{row.method}</td>
            <td>{row.statusCodeFamily}</td>
            <td>{row.errorCategory === 'none' ? '-' : row.errorCategory}</td>
            <td>{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LatencyTable({ rows }: { rows: ObservabilityLatency[] }) {
  if (rows.length === 0) {
    return (
      <div className="admin-list-row admin-muted">
        Sem amostras de latência.
      </div>
    );
  }

  return (
    <table className="admin-table" data-testid="observability-latency-table">
      <thead>
        <tr>
          <th>Rota</th>
          <th>Método</th>
          <th>Amostras</th>
          <th>p50</th>
          <th>p95</th>
          <th>p99</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.method}-${row.routeTemplate}`}>
            <td>{row.routeTemplate}</td>
            <td>{row.method}</td>
            <td>{row.count}</td>
            <td>{row.p50Ms} ms</td>
            <td>{row.p95Ms} ms</td>
            <td>{row.p99Ms} ms</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DomainEventTable({
  rows,
  empty,
}: {
  rows: ObservabilityDomainEvent[];
  empty: string;
}) {
  if (rows.length === 0)
    return <div className="admin-list-row admin-muted">{empty}</div>;

  return (
    <table className="admin-table" data-testid="observability-domain-table">
      <thead>
        <tr>
          <th>Evento</th>
          <th>Resultado</th>
          <th>Erro</th>
          <th>Contagem</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.eventName}-${row.outcome}-${row.errorCategory}`}>
            <td>{row.eventName}</td>
            <td>{row.outcome === 'none' ? '-' : row.outcome}</td>
            <td>{row.errorCategory === 'none' ? '-' : row.errorCategory}</td>
            <td>{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function healthLabel(value: string) {
  const labels: Record<string, string> = {
    ok: 'OK',
    ready: 'Ready',
    not_ready: 'Not ready',
    error: 'Erro',
    unknown: 'Indefinido',
  };
  return labels[value] ?? value;
}

function sumCounters(rows: ObservabilityCounter[]) {
  return rows.reduce((total, row) => total + row.count, 0);
}

function maxLatency(rows: ObservabilityLatency[], key: 'p95Ms') {
  return rows.reduce((max, row) => Math.max(max, row[key]), 0);
}
