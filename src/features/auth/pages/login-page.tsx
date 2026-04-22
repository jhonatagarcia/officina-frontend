import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { useLogin } from '@/features/auth/hooks/use-login';
import { loginSchema, type LoginSchema } from '@/features/auth/schemas/login-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="hidden rounded-[32px] bg-slate-950 p-10 text-white shadow-panel lg:block">
          <div className="max-w-md space-y-6">
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm">Operação inteligente de oficina</div>
            <h1 className="text-5xl font-extrabold leading-tight">{env.VITE_APP_NAME}</h1>
            <p className="text-lg text-slate-300">
              Controle clientes, veículos, orçamento, OS, estoque, financeiro e histórico em uma única interface.
            </p>
          </div>
        </div>

        <Card className="border-white/60 bg-card/95 shadow-panel backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <CardTitle className="text-3xl font-extrabold">Entrar</CardTitle>
            <CardDescription>Use suas credenciais para acessar o sistema de gestão da oficina.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <TextField
                control={form.control}
                name="email"
                label="E-mail"
                placeholder="seuemail@oficina.com"
                error={form.formState.errors.email?.message}
              />
              <TextField
                control={form.control}
                name="password"
                label="Senha"
                type="password"
                placeholder="••••••••"
                error={form.formState.errors.password?.message}
              />
              <Button className="w-full" disabled={isLoggingIn} type="submit">
                {isLoggingIn ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
