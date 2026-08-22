import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import '@/styles/landing.css';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
import { TestimonialCard } from '../components/testimonial-card';
import { usePublicTestimonials } from '@/features/support/hooks/use-support';

const PAGE_SIZE = 12;

export function TestimonialsPage() {
  const [page, setPage] = useState(1);
  const testimonialsQuery = usePublicTestimonials(page, PAGE_SIZE);
  const testimonials = testimonialsQuery.data?.data ?? [];
  const meta = testimonialsQuery.data?.meta;

  return (
    <div className="landing-root">
      <Helmet>
        <title>Comentários de clientes — AutoPro System</title>
        <meta
          name="description"
          content="Veja os comentários 5 estrelas de quem usa o AutoPro System no dia a dia."
        />
      </Helmet>
      <SiteHeader />
      <main className="testimonials-page">
        <section className="section">
          <div className="section-inner">
            <Link className="testimonials-back" to="/">
              <ArrowLeft size={17} aria-hidden="true" /> Voltar à página inicial
            </Link>
            <div className="section-tag">Comentários 5 estrelas</div>
            <h1 className="section-title">
              Experiências de quem usa o AutoPro System
            </h1>
            <p className="section-sub">
              Avaliações reais enviadas por usuários dentro da plataforma.
            </p>

            {testimonialsQuery.isLoading ? (
              <p className="testimonials-feedback">Carregando comentários...</p>
            ) : null}
            {!testimonialsQuery.isLoading && testimonials.length === 0 ? (
              <p className="testimonials-feedback">
                Nenhum comentário publicado nesta página.
              </p>
            ) : null}

            <div className="testimonials-grid">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  index={index}
                />
              ))}
            </div>

            {meta && meta.totalPages > 1 ? (
              <nav
                className="testimonials-pagination"
                aria-label="Paginação de comentários"
              >
                <button
                  type="button"
                  disabled={page <= 1 || testimonialsQuery.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={16} aria-hidden="true" /> Anterior
                </button>
                <span>
                  Página {meta.page} de {meta.totalPages}
                </span>
                <button
                  type="button"
                  disabled={
                    page >= meta.totalPages || testimonialsQuery.isFetching
                  }
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima <ChevronRight size={16} aria-hidden="true" />
                </button>
              </nav>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
