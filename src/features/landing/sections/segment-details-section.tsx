import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, Maximize2, X } from 'lucide-react';
import { segmentDetails } from '../content';
import { LandingImage } from '../components/landing-image';
import { Reveal } from '../components/reveal';

export function SegmentDetailsSection() {
  const [openImageId, setOpenImageId] = useState<string | null>(null);

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
                  <Dialog.Root
                    open={openImageId === segment.id}
                    onOpenChange={(open) =>
                      setOpenImageId(open ? segment.id : null)
                    }
                  >
                    <Dialog.Trigger asChild>
                      <button
                        type="button"
                        className="detail-img-button"
                        aria-label={`Ampliar imagem: ${segment.image.alt}`}
                      >
                        <LandingImage image={segment.image} className="mock-img" />
                        <span className="detail-img-zoom-hint" aria-hidden="true">
                          <Maximize2 size={16} />
                          Ampliar
                        </span>
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay
                        className="landing-image-dialog-overlay"
                        onClick={() => setOpenImageId(null)}
                      />
                      <Dialog.Content
                        className="landing-image-dialog-content"
                        aria-describedby={undefined}
                      >
                        <Dialog.Title className="sr-only">
                          {segment.image.alt}
                        </Dialog.Title>
                        <img
                          src={segment.image.src ?? ''}
                          alt={segment.image.alt}
                          className="landing-image-dialog-image"
                          decoding="async"
                        />
                        <Dialog.Close
                          type="button"
                          className="landing-image-dialog-close"
                          aria-label="Fechar imagem ampliada"
                        >
                          <X size={20} aria-hidden="true" />
                        </Dialog.Close>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
