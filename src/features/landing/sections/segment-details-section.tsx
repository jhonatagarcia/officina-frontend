import { Check } from 'lucide-react';
import { segmentDetails } from '../content';
import { LandingImage } from '../components/landing-image';
import { Reveal } from '../components/reveal';

export function SegmentDetailsSection() {
  return (
    <>
      {segmentDetails.map((segment) => (
        <section
          className={`section detail-section${segment.alt ? ' alt' : ''}`}
          id={segment.id}
          key={segment.id}
        >
          <div className="section-inner">
            <div className={`detail-grid${segment.reverse ? ' reverse' : ''}`}>
              <Reveal>
                <div className="detail-tag">{segment.tag}</div>
                <h3 className="detail-title">{segment.title}</h3>
                <p className="detail-desc">{segment.description}</p>
                <ul className="detail-list">
                  {segment.bullets.map((bullet) => (
                    <li key={bullet}>
                      <span className="detail-check">
                        <Check size={11} aria-hidden />
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={100}>
                <div className="detail-img-wrap">
                  <LandingImage image={segment.image} className="mock-img" />
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
