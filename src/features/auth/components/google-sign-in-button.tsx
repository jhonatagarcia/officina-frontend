import { useEffect, useId, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const googleIdentityScriptId = 'google-identity-services';
const googleIdentityScriptSrc = 'https://accounts.google.com/gsi/client';

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme: 'outline';
      size: 'large';
      type: 'standard';
      shape: 'rectangular';
      text: 'signin_with';
      logo_alignment: 'left';
      width?: number;
    },
  ) => void;
}

interface GoogleIdentityWindow extends Window {
  google?: {
    accounts?: {
      id?: GoogleAccountsId;
    };
  };
}

type GoogleButtonState = 'idle' | 'loading' | 'ready' | 'unavailable';

interface GoogleSignInButtonProps {
  clientId: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  onCredential: (credential: string) => void;
  onGoogleError: () => void;
}

function getGoogleIdentity() {
  return (window as GoogleIdentityWindow).google?.accounts?.id;
}

function isValidGoogleClientId(clientId: string) {
  return /^[^\s@]+\.apps\.googleusercontent\.com$/.test(clientId);
}

function loadGoogleIdentityScript() {
  if (getGoogleIdentity()) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(googleIdentityScriptId) as HTMLScriptElement | null;

  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      if (getGoogleIdentity()) {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('google_identity_unavailable')), { once: true });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = googleIdentityScriptId;
    script.src = googleIdentityScriptSrc;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('google_identity_unavailable'));
    document.head.appendChild(script);
  });
}

export function GoogleSignInButton({ clientId, disabled = false, isSubmitting = false, onCredential, onGoogleError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const descriptionId = useId();
  const hasValidClientId = isValidGoogleClientId(clientId);
  const [state, setState] = useState<GoogleButtonState>(hasValidClientId ? 'loading' : 'unavailable');

  useEffect(() => {
    let cancelled = false;

    function renderGoogleButton(googleIdentity: GoogleAccountsId) {
      if (!containerRef.current) return;

      containerRef.current.replaceChildren();
      googleIdentity.initialize({
        client_id: clientId,
        callback: (response) => {
          const credential = response.credential?.trim();
          if (!credential) {
            onGoogleError();
            return;
          }
          onCredential(credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      googleIdentity.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
        width: 400,
      });
      setState('ready');
    }

    async function initializeGoogleButton() {
      if (!hasValidClientId || !containerRef.current) {
        setState('unavailable');
        return;
      }

      const loadedIdentity = getGoogleIdentity();
      if (loadedIdentity) {
        renderGoogleButton(loadedIdentity);
        return;
      }

      setState('loading');

      try {
        await loadGoogleIdentityScript();
        if (cancelled || !containerRef.current) return;

        const googleIdentity = getGoogleIdentity();
        if (!googleIdentity) {
          throw new Error('google_identity_unavailable');
        }

        renderGoogleButton(googleIdentity);
      } catch {
        if (!cancelled) {
          setState('unavailable');
          onGoogleError();
        }
      }
    }

    void initializeGoogleButton();

    return () => {
      cancelled = true;
    };
  }, [clientId, hasValidClientId, onCredential, onGoogleError]);

  const isUnavailable = state === 'unavailable';
  const isLoading = state === 'loading';
  const isBlocked = disabled || isSubmitting || isLoading;

  const googleLogo = (
    <svg aria-hidden="true" height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );

  if (isUnavailable) {
    return (
      <button
        aria-describedby={descriptionId}
        className="grid h-11 w-full cursor-not-allowed place-items-center rounded-md border border-white/10 bg-slate-800/60 text-sm font-medium text-slate-300 opacity-60"
        disabled
        type="button"
      >
        <span className="flex items-center gap-3">
          {googleLogo}
          <span>Fazer Login com o Google</span>
        </span>
        <span id={descriptionId} className="sr-only">Login com Google indisponível.</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div
        aria-busy={isBlocked}
        className={cn(
          'flex min-h-11 w-full items-center justify-center overflow-hidden rounded-md bg-white',
          isBlocked ? 'pointer-events-none opacity-70' : null,
        )}
      >
        <div ref={containerRef} className="flex w-full justify-center" />
      </div>
      {isSubmitting ? (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-400" role="status">
          <Loader2 className="size-3.5 animate-spin" />
          Validando acesso com Google...
        </p>
      ) : null}
    </div>
  );
}
