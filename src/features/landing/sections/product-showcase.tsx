import { useState } from 'react';
import { showcase, showcaseTabs } from '../content';
import { LandingImage } from '../components/landing-image';
import { useRovingTabs } from '../hooks/use-roving-tabs';

export function ProductShowcase() {
  const [active, setActive] = useState(0);
  const { setTabRef, onKeyDown } = useRovingTabs(showcaseTabs.length, setActive);
  const activeTab = showcaseTabs[active] ?? showcaseTabs[0];

  if (!activeTab) return null;

  return (
    <section className="section showcase-section" id="produto">
      <div className="section-inner">
        <div className="section-tag">{showcase.tag}</div>
        <h2 className="section-title">{showcase.title}</h2>
        <p className="section-sub" style={{ marginBottom: 36 }}>{showcase.subtitle}</p>
        <div className="showcase-tabs" role="tablist" aria-label="Telas do produto">
          {showcaseTabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={setTabRef(index)}
              className={`sc-tab${index === active ? ' active' : ''}`}
              type="button"
              role="tab"
              id={`showcase-tab-${tab.id}`}
              aria-selected={index === active}
              aria-controls="showcase-panel"
              tabIndex={index === active ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="showcase-frame">
          <div className="sc-chrome">
            <div className="sc-chrome-dots" aria-hidden="true">
              <div className="sc-chrome-dot" />
              <div className="sc-chrome-dot" />
              <div className="sc-chrome-dot" />
            </div>
            <div className="sc-chrome-url">{activeTab.image.url}</div>
          </div>
          <div
            role="tabpanel"
            id="showcase-panel"
            aria-labelledby={`showcase-tab-${activeTab.id}`}
          >
            <LandingImage key={activeTab.id} image={activeTab.image} className="mock-img" />
          </div>
        </div>
      </div>
    </section>
  );
}
