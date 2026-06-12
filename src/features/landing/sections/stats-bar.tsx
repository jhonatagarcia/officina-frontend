import { stats, type Stat } from '../content';
import { useCountUp } from '../hooks/use-count-up';
import { useInView } from '../hooks/use-in-view';

function StatItem({ stat, started }: { stat: Stat; started: boolean }) {
  const value = useCountUp(stat.target, started);

  return (
    <div className="stat">
      <div className="stat-num">
        {value}
        {stat.suffix}
      </div>
      <div className="stat-label">{stat.label}</div>
    </div>
  );
}

export function StatsBar() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.5 });

  return (
    <div className="stats" ref={ref}>
      <div className="stats-inner">
        {stats.map((stat) => (
          <StatItem key={stat.label} stat={stat} started={inView} />
        ))}
      </div>
    </div>
  );
}
