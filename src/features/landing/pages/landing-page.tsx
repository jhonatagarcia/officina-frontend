import { Helmet } from 'react-helmet-async';
import '@/styles/landing.css';
import { SiteHeader } from '../components/site-header';
import { SiteFooter } from '../components/site-footer';
import { HeroSection } from '../sections/hero-section';
import { SegmentsStrip } from '../sections/segments-strip';
import { StatsBar } from '../sections/stats-bar';
import { FeaturesGrid } from '../sections/features-grid';
// TODO(WhatsApp Cloud API): reativar a secao comercial somente quando a feature voltar ao produto.
// import { WhatsAppSection } from '../sections/whatsapp-section';
import { ProductShowcase } from '../sections/product-showcase';
import { SegmentDetailsSection } from '../sections/segment-details-section';
import { PricingSection } from '../sections/pricing-section';
import { TestimonialsGrid } from '../sections/testimonials-grid';
import { FinalCtaSection } from '../sections/final-cta-section';
import { seo } from '../content';

export function LandingPage() {
  return (
    <div className="landing-root">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content="https://autoprosystem.com.br" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
        <link rel="canonical" href="https://autoprosystem.com.br" />
      </Helmet>

      <SiteHeader />
      <main>
        <HeroSection />
        <SegmentsStrip />
        <StatsBar />
        <FeaturesGrid />
        {/* TODO(WhatsApp Cloud API): <WhatsAppSection /> */}
        <ProductShowcase />
        <SegmentDetailsSection />
        <PricingSection />
        <TestimonialsGrid />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
