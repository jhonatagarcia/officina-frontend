import { testimonials } from '../content';
import { Reveal } from '../components/reveal';

export function TestimonialsGrid() {
  return (
    <section className="section testimonials-section">
      <div className="section-inner">
        <div className="section-tag">Depoimentos</div>
        <h2 className="section-title">Quem usa, recomenda</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.name} delay={index * 80} className="testi">
              <div className="testi-stars" aria-label="5 de 5 estrelas">
                <span aria-hidden="true">★★★★★</span>
              </div>
              <p className="testi-text">"{testimonial.quote}"</p>
              <div className="testi-author">
                <div className="testi-avatar">{testimonial.initials}</div>
                <div>
                  <div className="testi-name">{testimonial.name}</div>
                  <div className="testi-role">{testimonial.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
