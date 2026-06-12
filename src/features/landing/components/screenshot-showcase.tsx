import type { CSSProperties } from 'react';

type ScreenshotShowcaseProps = {
  title: string;
  description: string;
  src: string;
  priority?: boolean;
  showCaption?: boolean;
  transitionName?: string | undefined;
};

export function ScreenshotShowcase({
  title,
  description,
  src,
  priority = false,
  showCaption = true,
  transitionName,
}: ScreenshotShowcaseProps) {
  const transitionStyle = transitionName
    ? ({ viewTransitionName: transitionName } as CSSProperties)
    : undefined;

  return (
    <figure className="screenshot-showcase" style={transitionStyle}>
      <div className="screenshot-showcase__bar">
        <div className="screenshot-showcase__traffic" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="screenshot-showcase__title">{title}</span>
      </div>
      <div className="screenshot-showcase__image">
        <img
          src={src}
          alt={`${title}: ${description}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>
      {showCaption ? (
        <figcaption>
          <strong>{title}</strong>
          <span>{description}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
