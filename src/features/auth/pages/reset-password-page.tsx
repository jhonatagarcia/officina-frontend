import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Wrench } from 'lucide-react';
import { authService } from '@/features/auth/services/auth-service';
import { resetPasswordSchema, type ResetPasswordSchema } from '@/features/auth/schemas/login-schema';
import { PasswordField } from '@/features/auth/components/password-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { env } from '@/lib/env';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token')?.trim() ?? '';
  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  const mutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso. Entre com sua nova senha.');
      navigate('/login', { replace: true });
    },
    onError: () => {
      toast.error('Não foi possível redefinir a senha. Solicite um novo link e tente novamente.');
    },
  });

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
            <CardTitle className="text-2xl font-extrabold text-white">Redefinir senha</CardTitle>
            <p className="text-sm text-slate-400">Escolha uma nova senha segura para acessar sua conta.</p>
          </CardHeader>
          <CardContent className="px-6 pb-7 sm:px-12">
            {!token ? (
              <div className="space-y-5 text-center">
                <p className="text-sm leading-6 text-slate-300">
                  O link de redefinição está inválido ou expirado. Solicite um novo link para continuar.
                </p>
                <Button asChild className="w-full">
                  <Link to="/login">Voltar ao login</Link>
                </Button>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={form.handleSubmit((values) => mutation.mutate({ token, password: values.password }))}
              >
                <Controller
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <PasswordField
                      id="reset-password"
                      autoComplete="new-password"
                      disabled={mutation.isPending}
                      error={form.formState.errors.password?.message}
                      inputClassName="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
                      label="Nova senha"
                      labelClassName="text-slate-200"
                      placeholder="Mínimo 8 caracteres"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <PasswordField
                      id="reset-confirm-password"
                      autoComplete="new-password"
                      disabled={mutation.isPending}
                      error={form.formState.errors.confirmPassword?.message}
                      inputClassName="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
                      label="Confirmar nova senha"
                      labelClassName="text-slate-200"
                      placeholder="Repita a senha"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Button className="h-11 w-full" disabled={mutation.isPending} type="submit">
                  {mutation.isPending ? 'Redefinindo...' : 'Redefinir senha'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
