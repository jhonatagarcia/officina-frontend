import { useCallback, useEffect } from 'react';
import { Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LoginForm } from '@/features/auth/components/login-form';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { useGoogleLogin } from '@/features/auth/hooks/use-google-login';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { env } from '@/lib/env';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

function getSafePostLoginPath() {
  return '/inicio/dashboard';
}

function getGoogleLoginErrorMessage(error: unknown) {
  const statusCode = (error as { statusCode?: unknown } | null)?.statusCode;

  if (statusCode === 400 || statusCode === 401) {
    return 'A autenticação do Google não foi validada. Tente novamente.';
  }

  if (statusCode === 409) {
    return 'Esta conta Google não pôde ser vinculada automaticamente. Entre com e-mail e senha.';
  }

  return 'Não foi possível entrar com Google. Tente novamente ou use e-mail e senha.';
}

export function LoginModal({
  isOpen,
  onClose,
  onRegisterClick,
}: LoginModalProps) {
  const navigate = useNavigate();
  const { loginWithGoogle, isGoogleLoggingIn } = useGoogleLogin();

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const onGoogleCredential = useCallback(
    async (credential: string) => {
      try {
        await loginWithGoogle({ credential });
        toast.success('Acesso com Google realizado com sucesso.');
        onClose();
        navigate(getSafePostLoginPath(), { replace: true });
      } catch (error) {
        toast.error(getGoogleLoginErrorMessage(error));
      }
    },
    [loginWithGoogle, navigate, onClose],
  );

  const onGoogleError = useCallback(() => {
    toast.error(
      'Não foi possível iniciar o login com Google. Tente novamente ou use e-mail e senha.',
    );
  }, []);

  if (!isOpen) return null;

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Login"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* modal panel */}
      <div className="relative w-full max-w-[480px] rounded-3xl border border-white/10 bg-slate-950 shadow-[0_32px_96px_rgba(0,0,0,0.6)]">
        <button
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          type="button"
          aria-label="Fechar"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="flex flex-col items-center px-6 pb-8 pt-10 text-slate-100 sm:px-10">
          {/* branding */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_18px_44px_rgba(234,88,12,0.22)]">
              <Wrench className="size-8" />
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
              {env.VITE_APP_NAME}
            </h2>
          </div>

          {/* login card */}
          <Card className="w-full border-white/10 bg-slate-900 text-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <CardHeader className="space-y-1 px-6 pb-4 pt-6 text-center">
              <CardTitle className="text-xl font-extrabold text-white">
                Entrar na sua conta
              </CardTitle>
              <p className="text-sm text-slate-400">
                Acesse o sistema de gestão do negócio.
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <LoginForm onSuccess={onClose} redirectTo="/inicio/dashboard" />

              <div className="mt-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  ou continue com
                </span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <div className="mt-4">
                <GoogleSignInButton
                  clientId={env.VITE_GOOGLE_CLIENT_ID}
                  isSubmitting={isGoogleLoggingIn}
                  onCredential={onGoogleCredential}
                  onGoogleError={onGoogleError}
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  className="text-sm font-medium text-orange-300 transition-colors hover:text-orange-200"
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/login');
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>
            </CardContent>
          </Card>

          {/* footer */}
          <p className="mt-6 text-center text-sm text-slate-400">
            Ainda não tem uma conta?{' '}
            <button
              className="font-semibold text-orange-300 transition-colors hover:text-orange-200"
              type="button"
              onClick={onRegisterClick}
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
