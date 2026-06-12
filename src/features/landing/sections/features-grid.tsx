import { features } from '../content';
import { Reveal } from '../components/reveal';

export function FeaturesGrid() {
  return (
    <section className="section features-section" id="funcionalidades">
      <div className="section-inner">
        <div className="section-tag">Funcionalidades</div>
        <h2 className="section-title">
          Tudo que sua operação
          <br />
          precisa em um lugar só
        </h2>
        <p className="section-sub">Do primeiro contato com o cliente até o fechamento financeiro.</p>
        <div className="features-grid">
          {features.map(({ icon: Icon, name, description }, index) => (
            <Reveal key={name} delay={(index % 3) * 80} className="feat">
              <div className="feat-icon">
                <Icon size={22} aria-hidden />
              </div>
              <div className="feat-name">{name}</div>
              <div className="feat-desc">{description}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
