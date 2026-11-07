import { Check } from 'lucide-react';
import { plans, pricing, type Plan } from '../content';
import { useAnimatedNumber } from '../hooks/use-animated-number';

export function PricingSection() {
  return (
    <section className="section pricing-section" id="planos">
      <div className="section-inner">
        <div className="section-tag">{pricing.tag}</div>
        <h2 className="section-title">{pricing.title}</h2>
        <p className="section-sub" style={{ marginBottom: 36 }}>{pricing.subtitle}</p>
        <div className="pricing-grid">
          {plans.map((plan) => <PlanCard key={plan.name} plan={plan} />)}
        </div>
        <p className="pricing-faq">
          Duvidas? <a href="mailto:contato@autoprosystem.com.br">fale com a gente</a>.
        </p>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const amount = useAnimatedNumber(plan.monthly);
  const formattedAmount = amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <article className={`plan${plan.highlighted ? ' hot' : ''}`}>
      {plan.highlighted ? <div className="plan-most-popular">Mais popular</div> : null}
      <div className="plan-name">{plan.name}</div>
      <div className="plan-price">
        <span className="plan-price-currency">R$</span>
        <span>{formattedAmount}</span>
        <span className="plan-price-cents">/mes</span>
      </div>
      <div className="plan-period">{pricing.periodMonthly}</div>
      <div className="plan-divider" />
      <p className="plan-desc">{plan.description}</p>
      <ul className="plan-features">
        {plan.features.map((feature) => (
          <li className="plan-feat" key={feature}>
            <span className="plan-check">
              <Check size={12} aria-hidden />
            </span>
            {feature}
          </li>
        ))}
      </ul>
      <a className={`plan-cta ${plan.highlighted ? 'plan-cta-fill' : 'plan-cta-ghost'}`} href={plan.cta.href}>
        {plan.cta.label}
      </a>
    </article>
  );
}
