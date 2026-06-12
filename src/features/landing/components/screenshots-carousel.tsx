import { useEffect, useState } from 'react';
import { ScreenshotShowcase } from './screenshot-showcase';

type Screenshot = {
  label: string;
  title: string;
  description: string;
  src: string;
};

type ScreenshotsCarouselProps = {
  screens: Screenshot[];
};

const AUTO_ADVANCE_MS = 6500;

export function ScreenshotsCarousel({ screens }: ScreenshotsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeScreen = screens[activeIndex];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isPaused || prefersReducedMotion || screens.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % screens.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, screens.length]);

  if (!activeScreen) return null;

  function goToPrevious() {
    setActiveIndex((current) => (current - 1 + screens.length) % screens.length);
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % screens.length);
  }

  return (
    <div
      className="screens-carousel"
      onBlur={(event) => {
        const nextFocusedElement = event.relatedTarget;
        if (!(nextFocusedElement instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) {
          setIsPaused(false);
        }
      }}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="screens-carousel__toolbar">
        <div>
          <span>Tour visual</span>
          <strong>{activeScreen.label}</strong>
        </div>
        <div className="screens-carousel__progress" aria-label={`Tela ${activeIndex + 1} de ${screens.length}`}>
          {screens.map((screen, index) => (
            <button
              className={`screens-carousel__dot ${index === activeIndex ? 'screens-carousel__dot--active' : ''}`}
              type="button"
              aria-label={`Mostrar ${screen.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              key={screen.label}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>

      <div className="screens-carousel__stage">
        <div className="screens-carousel__viewport">
          <ScreenshotShowcase
            key={activeScreen.src}
            title={activeScreen.title}
            description={activeScreen.description}
            src={activeScreen.src}
            showCaption={false}
          />
          {screens.length > 1 ? (
            <div className="screens-carousel__arrows" aria-label="Controle do carrossel">
              <button className="screens-carousel__arrow" type="button" aria-label="Tela anterior" onClick={goToPrevious}>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button className="screens-carousel__arrow" type="button" aria-label="Próxima tela" onClick={goToNext}>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>

        <div className="screens-carousel__details" aria-live="polite">
          <span>{activeScreen.label}</span>
          <h3>{activeScreen.title}</h3>
          <p>{activeScreen.description}</p>
          <div className="screens-carousel__meta" aria-hidden="true">
            <small>Fluxo conectado</small>
            <small>Dados centralizados</small>
            <small>Operação diária</small>
          </div>
          <strong>
            {String(activeIndex + 1).padStart(2, '0')} / {String(screens.length).padStart(2, '0')}
          </strong>
        </div>
      </div>

      <div className="screens-grid" aria-label="Telas disponíveis">
        {screens.map((screen, index) => (
          <button
            className={`screen-thumb ${index === activeIndex ? 'screen-thumb--active' : ''}`}
            type="button"
            aria-current={index === activeIndex ? 'true' : undefined}
            aria-label={`Mostrar ${screen.title}`}
            key={screen.label}
            onClick={() => setActiveIndex(index)}
          >
            <strong>{screen.label}</strong>
            <span>{screen.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
