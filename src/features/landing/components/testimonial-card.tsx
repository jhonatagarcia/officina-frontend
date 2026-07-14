import type { PublicTestimonial } from '@/features/support/types';
import { Reveal } from './reveal';

export function TestimonialCard({
  testimonial,
  index = 0,
}: {
  testimonial: PublicTestimonial;
  index?: number;
}) {
  return (
    <Reveal delay={index * 80} className="testi">
      <div
        className="testi-stars"
        aria-label={`${testimonial.rating} de 5 estrelas`}
      >
        <span aria-hidden="true">★★★★★</span>
      </div>
      <p className="testi-text">“{testimonial.quote}”</p>
      <div className="testi-author">
        <div className="testi-avatar">{testimonial.initials}</div>
        <div>
          <div className="testi-name">{testimonial.name}</div>
          <div className="testi-role">{testimonial.role}</div>
        </div>
      </div>
    </Reveal>
  );
}
