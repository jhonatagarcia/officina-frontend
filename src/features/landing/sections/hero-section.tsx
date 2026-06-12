import { type MouseEvent } from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { hero, heroTabs } from '../content';
import { BrowserMockup } from '../components/browser-mockup';
import { ButtonLink } from '../components/button-link';
import { WhatsAppIcon } from '../components/whatsapp-icon';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

export function HeroSection() {
  const reduced = usePrefersReducedMotion();

  function handleMouseMove(event: MouseEvent<HTMLElement>) {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty('--my', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
  }

  function handleMouseLeave(event: MouseEvent<HTMLElement>) {
    event.currentTarget.style.setProperty('--mx', '50%');
    event.currentTarget.style.setProperty('--my', '-5%');
  }

  return (
    <section className="hero" id="top" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div className="hero-inner">
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          {hero.badge}
        </div>
        <h1>
          {hero.titleLead}
          <br />
          <em>{hero.titleHighlight}</em>
          <br />
          {hero.titleTail}
        </h1>
        <p className="hero-sub">{hero.subtitle}</p>
        <div className="hero-ctas">
          <ButtonLink href={hero.primaryCta.href}>
            {hero.primaryCta.label}
            <ArrowRight size={15} aria-hidden />
          </ButtonLink>
          <ButtonLink href={hero.secondaryCta.href} variant="ghost">
            <PlayCircle size={16} aria-hidden />
            {hero.secondaryCta.label}
          </ButtonLink>
        </div>
        <div className="hero-mockup">
          <BrowserMockup tabs={heroTabs} idPrefix="hero-browser" ariaLabel="Telas principais do AutoPro System" />
          <div className="hero-notif" aria-hidden="true">
            <div className="hero-notif-ico">
              <WhatsAppIcon />
            </div>
            <div>
              <div className="hero-notif-app">{hero.notification.app}</div>
              <div className="hero-notif-msg">{hero.notification.message}</div>
            </div>
          </div>
          <div className="hero-kpi" aria-hidden="true">
            <div className="hero-kpi-label">{hero.kpi.label}</div>
            <div className="hero-kpi-val">{hero.kpi.value}</div>
            <div className="hero-kpi-delta">{hero.kpi.delta}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
