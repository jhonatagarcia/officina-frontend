import { Lock } from 'lucide-react';
import type { BrowserTab } from '../content';
import { useAutoplayTabs } from '../hooks/use-autoplay-tabs';
import { useRovingTabs } from '../hooks/use-roving-tabs';
import { LandingImage } from './landing-image';

interface BrowserMockupProps {
  tabs: BrowserTab[];
  /** Prefixo para os ids de acessibilidade (tab/tabpanel). */
  idPrefix: string;
  ariaLabel: string;
}

/**
 * Mockup de navegador com tabs em autoplay (3,5s), pausa de 9s após
 * interação manual e troca de imagem com fade. Operável por teclado.
 */
export function BrowserMockup({ tabs, idPrefix, ariaLabel }: BrowserMockupProps) {
  const { active, select } = useAutoplayTabs(tabs.length);
  const { setTabRef, onKeyDown } = useRovingTabs(tabs.length, select);
  const activeTab = tabs[active] ?? tabs[0];

  if (!activeTab) return null;

  return (
    <div className="hero-mockup-wrap">
      <div className="brow">
        <div className="brow-top">
          <div className="brow-dots" aria-hidden>
            <div className="brow-dot r" />
            <div className="brow-dot y" />
            <div className="brow-dot g" />
          </div>
          <div className="brow-bar">
            <Lock className="brow-bar-lock" size={11} aria-hidden />
            <span className="brow-bar-url">{activeTab.image.url}</span>
          </div>
        </div>
        <div className="brow-tabs" role="tablist" aria-label={ariaLabel}>
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={setTabRef(index)}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${tab.id}`}
              aria-selected={index === active}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={index === active ? 0 : -1}
              className={`brow-tab${index === active ? ' active' : ''}`}
              onClick={() => select(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="hero-img-area"
        role="tabpanel"
        id={`${idPrefix}-panel`}
        aria-labelledby={`${idPrefix}-tab-${activeTab.id}`}
      >
        <LandingImage
          key={activeTab.id}
          image={activeTab.image}
          className="mock-img"
          eager={active === 0}
        />
      </div>
    </div>
  );
}
