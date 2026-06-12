import type { CSSProperties } from 'react';

export function KpiCard({
  label,
  value,
  hint,
  color = '#ff7425',
  negative,
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
  negative?: boolean;
}) {
  return (
    <section className="admin-card admin-card-pad admin-kpi" style={{ '--accent-color': color } as CSSProperties}>
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value">{value}</div>
      {hint ? <div className={negative ? 'admin-negative' : 'admin-positive'}>{hint}</div> : null}
    </section>
  );
}
