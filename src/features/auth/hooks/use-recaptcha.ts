import { useCallback } from 'react';
import { env } from '@/lib/env';

const recaptchaScriptId = 'google-recaptcha-v3';
const recaptchaScriptTimeoutMs = 10_000;

interface RecaptchaWindow extends Window {
  grecaptcha?: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}

function getRecaptcha() {
  return (window as RecaptchaWindow).grecaptcha;
}

function loadRecaptchaScript(siteKey: string) {
  if (getRecaptcha()) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(recaptchaScriptId) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      if (existingScript.dataset['loaded'] === 'true') {
        resolve();
        return;
      }

      const timeout = window.setTimeout(() => reject(new Error('recaptcha_script_timeout')), recaptchaScriptTimeoutMs);
      existingScript.addEventListener('load', () => {
        window.clearTimeout(timeout);
        existingScript.dataset['loaded'] = 'true';
        resolve();
      }, { once: true });
      existingScript.addEventListener('error', () => {
        window.clearTimeout(timeout);
        reject(new Error('recaptcha_script_load_failed'));
      }, { once: true });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = recaptchaScriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;

    const timeout = window.setTimeout(() => reject(new Error('recaptcha_script_timeout')), recaptchaScriptTimeoutMs);
    script.onload = () => {
      window.clearTimeout(timeout);
      script.dataset['loaded'] = 'true';
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('recaptcha_script_load_failed'));
    };
    document.head.appendChild(script);
  });
}

export function useRecaptcha() {
  return useCallback(async (action: string) => {
    const siteKey = env.VITE_RECAPTCHA_SITE_KEY.trim();

    if (!siteKey) {
      return undefined;
    }

    await loadRecaptchaScript(siteKey);
    const recaptcha = getRecaptcha();

    if (!recaptcha) {
      throw new Error('recaptcha_unavailable');
    }

    return new Promise<string>((resolve, reject) => {
      recaptcha.ready(() => {
        recaptcha.execute(siteKey, { action }).then(resolve).catch(reject);
      });
    });
  }, []);
}
