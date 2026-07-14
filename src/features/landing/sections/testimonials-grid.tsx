import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { usePublicTestimonials } from '@/features/support/hooks/use-support';
import { TestimonialCard } from '../components/testimonial-card';

export function TestimonialsGrid() {
  const testimonialsQuery = usePublicTestimonials(1, 3);
  const testimonials = testimonialsQuery.data?.data.slice(0, 3) ?? [];

  return (
    <section className="section testimonials-section">
      <div className="section-inner">
        <div className="section-tag">Depoimentos</div>
        <h2 className="section-title">Quem usa, recomenda</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
        {testimonialsQuery.isLoading ? (
          <p className="testimonials-feedback">Carregando comentários...</p>
        ) : null}
        {!testimonialsQuery.isLoading && testimonials.length === 0 ? (
          <p className="testimonials-feedback">
            Os próximos comentários 5 estrelas aparecerão aqui.
          </p>
        ) : null}
        <div className="testimonials-more">
          <Link to="/avaliacoes">
            Ver todos os comentários positivos{' '}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
