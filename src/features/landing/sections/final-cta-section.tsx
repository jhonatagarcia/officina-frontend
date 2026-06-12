import { ArrowRight } from 'lucide-react';
import { finalCta } from '../content';
import { ButtonLink } from '../components/button-link';

export function FinalCtaSection() {
  return (
    <section className="final-cta">
      <div className="final-cta-inner">
        <h2>{finalCta.title}</h2>
        <p>{finalCta.subtitle}</p>
        <div className="final-cta-btns">
          <ButtonLink href={finalCta.primaryCta.href}>
            {finalCta.primaryCta.label}
            <ArrowRight size={15} aria-hidden />
          </ButtonLink>
          <ButtonLink href={finalCta.secondaryCta.href} variant="ghost">
            {finalCta.secondaryCta.label}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
