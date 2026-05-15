import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useLogin } from '@/features/auth/hooks/use-login';
import { authService } from '@/features/auth/services/auth-service';
import { forgotPasswordSchema, loginSchema, type ForgotPasswordSchema, type LoginSchema } from '@/features/auth/schemas/login-schema';
import { CaptchaField } from '@/features/auth/components/captcha-field';
import { PasswordField } from '@/features/auth/components/password-field';
import { RegisterWorkshopDialog } from '@/features/auth/components/register-workshop-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { env } from '@/lib/env';

function getSafePostLoginPath(state: unknown) {
  const pathname = (state as { from?: { pathname?: unknown } } | null)?.from?.pathname;

  return typeof pathname === 'string' && pathname.startsWith('/app/') ? pathname : '/app/dashboard';
}

export function LoginPage() {
  const { login, isLoggingIn } = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [registerOpen, setRegisterOpen] = useState(false);
  const loginForm = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      captchaToken: '',
    },
  });
  const forgotForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      captchaToken: '',
    },
  });
  const forgotMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      toast.success('Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição.');
      forgotForm.reset({ email: '', captchaToken: '' });
      setMode('login');
    },
    onError: () => {
      toast.error('Não foi possível solicitar a redefinição agora. Tente novamente em instantes.');
    },
  });

  async function onLoginSubmit(values: LoginSchema) {
    try {
      await login(values);
      toast.success('Acesso realizado com sucesso.');
      navigate(getSafePostLoginPath(location.state), { replace: true });
    } catch {
      toast.error('Não foi possível entrar. Verifique os dados e tente novamente.');
    }
  }

  function onForgotSubmit(values: ForgotPasswordSchema) {
    forgotMutation.mutate(values);
  }

  const isForgotMode = mode === 'forgot';

  return (
    <div className="surface-grid min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_18px_44px_rgba(234,88,12,0.22)]">
            <Wrench className="size-8" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">ERP Oficina</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{env.VITE_APP_NAME}</h1>
        </div>

        <Card className="w-full max-w-[480px] border-white/10 bg-slate-900/78 text-slate-100 shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <CardHeader className="space-y-2 px-6 pb-4 pt-7 text-center sm:px-12">
            {isForgotMode ? (
              <button
                className="mb-2 inline-flex items-center justify-center gap-2 self-center text-sm font-medium text-slate-300 transition-colors hover:text-white"
                type="button"
                onClick={() => setMode('login')}
              >
                <ArrowLeft className="size-4" />
                Voltar ao login
              </button>
            ) : null}
            <CardTitle className="text-2xl font-extrabold text-white">{isForgotMode ? 'Recuperar senha' : 'Entrar na sua conta'}</CardTitle>
            <p className="text-sm text-slate-400">
              {isForgotMode ? 'Informe seu e-mail e enviaremos as instruções se houver uma conta vinculada.' : 'Acesse o sistema de gestão da oficina.'}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-7 sm:px-12">
            {isForgotMode ? (
              <form className="space-y-5" onSubmit={forgotForm.handleSubmit(onForgotSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-slate-200">E-mail</Label>
                  <Input
                    id="forgot-email"
                    autoComplete="email"
                    className="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
                    disabled={forgotMutation.isPending}
                    invalid={Boolean(forgotForm.formState.errors.email)}
                    placeholder="seuemail@oficina.com"
                    type="email"
                    {...forgotForm.register('email')}
                  />
                  {forgotForm.formState.errors.email ? <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p> : null}
                </div>
                <CaptchaField
                  disabled={forgotMutation.isPending}
                  error={forgotForm.formState.errors.captchaToken?.message}
                  value={forgotForm.watch('captchaToken')}
                  onChange={(value) => forgotForm.setValue('captchaToken', value, { shouldValidate: true })}
                />
                <Button className="h-11 w-full" disabled={forgotMutation.isPending} type="submit">
                  {forgotMutation.isPending ? 'Enviando...' : 'Enviar instruções'}
                </Button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-200">E-mail</Label>
                  <Input
                    id="login-email"
                    autoComplete="email"
                    className="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
                    disabled={isLoggingIn}
                    invalid={Boolean(loginForm.formState.errors.email)}
                    placeholder="seuemail@oficina.com"
                    type="email"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email ? <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p> : null}
                </div>
                <Controller
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <PasswordField
                      id="login-password"
                      autoComplete="current-password"
                      disabled={isLoggingIn}
                      error={loginForm.formState.errors.password?.message}
                      inputClassName="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
                      label="Senha"
                      labelClassName="text-slate-200"
                      placeholder="Sua senha"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <CaptchaField
                  disabled={isLoggingIn}
                  error={loginForm.formState.errors.captchaToken?.message}
                  value={loginForm.watch('captchaToken')}
                  onChange={(value) => loginForm.setValue('captchaToken', value, { shouldValidate: true })}
                />
                <div className="flex justify-end">
                  <button
                    className="text-sm font-medium text-orange-300 transition-colors hover:text-orange-200"
                    type="button"
                    onClick={() => setMode('forgot')}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <Button className="h-11 w-full" disabled={isLoggingIn} type="submit">
                  {isLoggingIn ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!isForgotMode ? (
          <div className="mt-8 text-center text-sm text-slate-400">
            Ainda não tem uma conta?{' '}
            <button
              className="font-semibold text-orange-300 transition-colors hover:text-orange-200"
              type="button"
              onClick={() => setRegisterOpen(true)}
            >
              Cadastre-se
            </button>
          </div>
        ) : null}
      </div>
      <RegisterWorkshopDialog
        open={registerOpen}
        onAuthenticated={() => navigate('/app/dashboard', { replace: true })}
        onOpenChange={setRegisterOpen}
        onRegistered={(email) => {
          loginForm.setValue('email', email);
          loginForm.setValue('password', '');
          loginForm.setValue('captchaToken', '');
        }}
      />
    </div>
  );
}
