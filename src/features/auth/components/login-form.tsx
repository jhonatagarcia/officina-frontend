import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLogin } from '@/features/auth/hooks/use-login';
import { useRecaptcha } from '@/features/auth/hooks/use-recaptcha';
import { loginSchema, type LoginSchema } from '@/features/auth/schemas/login-schema';
import { PasswordField } from '@/features/auth/components/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginFailureMessage = 'Usuário não cadastrado ou senha inválida.';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo = '/inicio/dashboard' }: LoginFormProps) {
  const { login, isLoggingIn } = useLogin();
  const executeRecaptcha = useRecaptcha();
  const navigate = useNavigate();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', captchaToken: '' },
  });

  async function onSubmit(values: LoginSchema) {
    try {
      form.clearErrors('root');
      const captchaToken = await executeRecaptcha('login');
      await login({ ...values, captchaToken });
      toast.success('Acesso realizado com sucesso.');
      onSuccess?.();
      navigate(redirectTo, { replace: true });
    } catch {
      form.setError('root', { message: loginFailureMessage });
      toast.error(loginFailureMessage);
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="lf-email" className="text-slate-200">E-mail</Label>
        <Input
          id="lf-email"
          autoComplete="email"
          className="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
          disabled={isLoggingIn}
          invalid={Boolean(form.formState.errors.email)}
          placeholder="seuemail@empresa.com"
          type="email"
          {...form.register('email')}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <Controller
        control={form.control}
        name="password"
        render={({ field }) => (
          <PasswordField
            id="lf-password"
            autoComplete="current-password"
            disabled={isLoggingIn}
            error={form.formState.errors.password?.message}
            inputClassName="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
            label="Senha"
            labelClassName="text-slate-200"
            placeholder="Sua senha"
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Button className="h-11 w-full" disabled={isLoggingIn} type="submit">
        {isLoggingIn ? 'Entrando...' : 'Entrar'}
      </Button>
      {form.formState.errors.root?.message ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}
    </form>
  );
}
