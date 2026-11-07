import { useEffect, useId, useRef } from 'react';
import { env } from '@/lib/env';

interface CaptchaFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  disabled?: boolean | undefined;
}

interface RecaptchaApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => number;
  reset: (widgetId?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
  }
}

let scriptPromise: Promise<void> | null = null;
const recaptchaLoadTimeoutMs = 10_000;

function waitForRecaptchaV2(): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const checkAvailability = () => {
      if (window.grecaptcha?.render) {
        resolve();
        return;
      }

      if (Date.now() - startedAt >= recaptchaLoadTimeoutMs) {
        reject(new Error('recaptcha_load_timeout'));
        return;
      }

      window.setTimeout(checkAvailability, 50);
    };

    checkAvailability();
  });
}

function loadRecaptchaV2(): Promise<void> {
  if (window.grecaptcha?.render) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-recaptcha-v2]');
    if (existing) {
      existing.addEventListener('error', () => reject(new Error('recaptcha_load_failed')), { once: true });
      void waitForRecaptchaV2().then(resolve, reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset['recaptchaV2'] = 'true';
    script.onerror = () => reject(new Error('recaptcha_load_failed'));
    document.head.appendChild(script);
    void waitForRecaptchaV2().then(resolve, reject);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });
  return scriptPromise;
}

export function CaptchaField({ value, onChange, error, disabled }: CaptchaFieldProps) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number>();
  const siteKey = env.VITE_RECAPTCHA_SITE_KEY.trim();

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let active = true;
    void loadRecaptchaV2().then(() => {
      if (!active || !containerRef.current || !window.grecaptcha || widgetIdRef.current !== undefined) return;
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onChange(token),
        'expired-callback': () => onChange(''),
        'error-callback': () => onChange(''),
        theme: 'dark',
      });
    }).catch(() => onChange(''));
    return () => { active = false; };
  }, [onChange, siteKey]);

  useEffect(() => {
    if (!value && widgetIdRef.current !== undefined) window.grecaptcha?.reset(widgetIdRef.current);
  }, [value]);

  if (!siteKey) {
    return (
      <div>
        <button
          aria-checked={Boolean(value)}
          role="checkbox"
          type="button"
          disabled={disabled}
          className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-800/80 px-3 text-left text-sm text-slate-200 disabled:opacity-60"
          onClick={() => onChange(value ? '' : 'local-captcha-ok')}
        >
          {value ? '✓ ' : ''}Não sou um robô
        </button>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div aria-disabled={disabled} className={disabled ? 'pointer-events-none opacity-60' : undefined}>
      <div id={`captcha-${reactId}`} ref={containerRef} className="min-h-[78px] overflow-x-auto" />
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
