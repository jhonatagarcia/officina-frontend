import { useState } from 'react';
import { KpiCard } from '../components/KpiCard';
import { TopBar } from '../components/TopBar';
import { planLabel } from '../lib/labels';
import { Period, useDashboardKpis, useOnboardingFunnel, useRevenueSeries } from './useDashboard';

const periodLabels: Record<Period, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  annual: 'Anual',
};

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('weekly');
  const kpis = useDashboardKpis(period);
  const revenue = useRevenueSeries(period);
  const funnel = useOnboardingFunnel();
  const maxRevenue = Math.max(...(revenue.data?.map((point) => point.mrr) ?? [1]), 1);
  const funnelRows = [
    ['Cadastro', funnel.data?.registered ?? 0, '#ff7425'],
    ['Teste ativo', funnel.data?.trialActive ?? 0, '#4db5ff'],
    ['Primeira OS', funnel.data?.firstServiceOrder ?? 0, '#a472f7'],
    ['Pagante', funnel.data?.paying ?? 0, '#35d05f'],
    ['Recorrente 60d', funnel.data?.active60d ?? 0, '#f1c400'],
  ];
  const maxFunnel = Math.max(...funnelRows.map((row) => Number(row[1])), 1);

  return (
    <>
      <TopBar title="Painel">
        <div className="admin-controls">
          {(Object.keys(periodLabels) as Period[]).map((key) => (
            <button
              className={`admin-button ${period === key ? '' : 'secondary'}`}
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
            >
              {periodLabels[key]}
            </button>
          ))}
        </div>
      </TopBar>
      <section className="admin-content admin-grid">
        <div className="admin-grid admin-kpis">
          <KpiCard label="Receita mensal" value={brl(kpis.data?.mrr ?? 0)} hint="+12% vs periodo ant." />
          <KpiCard label="Receita anual projetada" value={brl(kpis.data?.arr ?? 0)} hint="+12% anualizado" color="#35d05f" />
          <KpiCard label="Oficinas ativas" value={String(kpis.data?.active ?? 0)} hint={`+${kpis.data?.newInPeriod ?? 0} novas no periodo`} color="#4db5ff" />
          <KpiCard label="Pagantes" value={String(kpis.data?.paying ?? 0)} hint="conversao atual" color="#a472f7" />
          <KpiCard label="Cancelamentos" value={`${kpis.data?.churnRate ?? 0}%`} hint="monitorado no periodo" color="#f1c400" negative />
          <KpiCard label="Em risco" value={String(kpis.data?.atRisk ?? 0)} hint="+30 dias sem login" color="#ff3f67" negative />
        </div>

        <div className="admin-grid admin-two">
          <section className="admin-card admin-card-pad">
            <strong>Receita por periodo</strong>
            <div className="admin-muted">Receita mensal acumulada</div>
            <div className="admin-chart">
              {(revenue.data?.length ? revenue.data : [{ label: 'Sem dados', mrr: 0 }]).map((point) => (
                <div key={point.label} style={{ flex: 1 }}>
                  <div className="admin-bar" style={{ height: `${Math.max((point.mrr / maxRevenue) * 180, 8)}px` }} />
                  <div className="admin-muted" style={{ textAlign: 'center', marginTop: 8 }}>{point.label}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="admin-card admin-card-pad">
            <strong>Oficinas por plano</strong>
            <div className="admin-muted">Distribuicao atual</div>
            {Object.entries(kpis.data?.planDistribution ?? {}).map(([plan, count]) => (
              <div className="admin-list-row" key={plan}>
                <span>{planLabel(plan)}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </section>
        </div>

        <section className="admin-card admin-card-pad">
          <strong>Funil de ativacao</strong>
          <div className="admin-muted">Conversao por etapa</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            {funnelRows.map(([label, value, color]) => (
              <div key={String(label)} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px', gap: 12, alignItems: 'center' }}>
                <span className="admin-muted">{label}</span>
                <div style={{ height: 22, background: '#0d0e17', borderRadius: 4 }}>
                  <div style={{ width: `${(Number(value) / maxFunnel) * 100}%`, height: '100%', background: String(color), borderRadius: 4 }} />
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
