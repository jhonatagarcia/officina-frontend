import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Wrench } from 'lucide-react';
import { useLogin } from '@/features/auth/hooks/use-login';
import { loginSchema, type LoginSchema } from '@/features/auth/schemas/login-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TextField } from '@/components/shared/form-fields';
import { env } from '@/lib/env';

export function LoginPage() {
  const { login, isLoggingIn } = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginSchema) {
    try {
      await login(values);
      toast.success('Acesso realizado com sucesso.');
      navigate(location.state?.from?.pathname ?? '/app/dashboard', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Credenciais inválidas.';
      toast.error(message);
    }
  }

  function handleFutureFeature(feature: string) {
    toast.info(`${feature} estará disponível em breve.`);
  }

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
            <CardTitle className="text-2xl font-extrabold text-white">Entrar na sua conta</CardTitle>
            <p className="text-sm text-slate-400">Acesse o sistema de gestão da oficina.</p>
          </CardHeader>
          <CardContent className="px-6 pb-7 sm:px-12">
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="[&_input]:border-white/10 [&_input]:bg-slate-800/80 [&_input]:text-white [&_input]:placeholder:text-slate-500 [&_label]:text-slate-200">
                <TextField
                  control={form.control}
                  name="email"
                  label="E-mail"
                  type="email"
                  placeholder="seuemail@oficina.com"
                  error={form.formState.errors.email?.message}
                />
              </div>
              <div className="[&_input]:border-white/10 [&_input]:bg-slate-800/80 [&_input]:text-white [&_input]:placeholder:text-slate-500 [&_label]:text-slate-200">
                <TextField
                  control={form.control}
                  name="password"
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  error={form.formState.errors.password?.message}
                />
              </div>
              <Button className="h-11 w-full" disabled={isLoggingIn} type="submit">
                {isLoggingIn ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-sm text-slate-300">Ou continue com</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Button
              className="h-11 w-full border-white/10 bg-slate-800/80 text-slate-100 hover:border-white/20 hover:bg-slate-800"
              type="button"
              variant="outline"
              onClick={() => handleFutureFeature('Login com Google')}
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-white text-sm font-extrabold text-primary">G</span>
              Entrar com Google
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-slate-400">
          Ainda não tem uma conta?{' '}
          <button
            className="font-semibold text-orange-300 transition-colors hover:text-orange-200"
            type="button"
            onClick={() => handleFutureFeature('Cadastro')}
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}
