import { useEffect, useId, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  if (isUnavailable) {
    return (
      <Button
        aria-describedby={descriptionId}
        className="h-11 w-full border-white/10 bg-white text-slate-500 hover:bg-white"
        disabled
        type="button"
        variant="outline"
      >
        Entrar com Google indisponível
        <span id={descriptionId} className="sr-only">
          Configure um client ID valido do Google para habilitar esta opcao.
        </span>
      </Button>
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
