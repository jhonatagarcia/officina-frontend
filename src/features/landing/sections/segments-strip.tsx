import { segments } from '../content';

export function SegmentsStrip() {
  return (
    <div className="logos-strip">
      <div className="logos-strip-inner">
        <span className="logos-label">Ideal para</span>
        {segments.map(({ label, icon: Icon }) => (
          <div key={label} className="logo-chip">
            <Icon size={15} aria-hidden />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
