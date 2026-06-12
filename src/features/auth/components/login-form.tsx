import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLogin } from '@/features/auth/hooks/use-login';
import { loginSchema, type LoginSchema } from '@/features/auth/schemas/login-schema';
import { CaptchaField } from '@/features/auth/components/captcha-field';
import { PasswordField } from '@/features/auth/components/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo = '/app/dashboard' }: LoginFormProps) {
  const { login, isLoggingIn } = useLogin();
  const navigate = useNavigate();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', captchaToken: '' },
  });

  async function onSubmit(values: LoginSchema) {
    try {
      await login(values);
      toast.success('Acesso realizado com sucesso.');
      onSuccess?.();
      navigate(redirectTo, { replace: true });
    } catch {
      toast.error('Não foi possível entrar. Verifique os dados e tente novamente.');
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
          placeholder="seuemail@oficina.com"
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

      <CaptchaField
        disabled={isLoggingIn}
        error={form.formState.errors.captchaToken?.message}
        value={form.watch('captchaToken')}
        onChange={(value) => form.setValue('captchaToken', value, { shouldValidate: true })}
      />

      <Button className="h-11 w-full" disabled={isLoggingIn} type="submit">
        {isLoggingIn ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
