import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { authService } from '@/features/auth/services/auth-service';
import {
  registerSchema,
  type RegisterSchema,
} from '@/features/auth/schemas/login-schema';
import { PasswordField } from '@/features/auth/components/password-field';
import { CaptchaField } from '@/features/auth/components/captcha-field';
import { onlyDigits } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import type { AuthSession } from '@/types/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function getRegisterErrorMessage(error: unknown) {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message.trim()
    ? message
    : 'Não foi possível concluir o cadastro. Revise os dados e tente novamente.';
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (!digits) return '';

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function isAuthSession(data: unknown): data is AuthSession {
  return Boolean(
    data && typeof data === 'object' && 'accessToken' in data && 'user' in data,
  );
}

interface RegisterWorkshopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered?: (session: AuthSession) => void;
}

export function RegisterWorkshopDialog({
  open,
  onOpenChange,
  onRegistered,
}: RegisterWorkshopDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tradeName: '',
      cnpj: '',
      email: '',
      password: '',
      confirmPassword: '',
      captchaToken: '',
    },
  });
  const mutation = useMutation({
    mutationFn: authService.registerWorkshop,
    onSuccess: (data) => {
      if (!isAuthSession(data)) {
        toast.success('Cadastro realizado com sucesso.');
        onOpenChange(false);
        form.reset();
        return;
      }

      queryClient.clear();
      setSession(data);
      toast.success('Cadastro realizado com sucesso. Você já está logado.');
      onRegistered?.(data);
      onOpenChange(false);
      form.reset();
      navigate('/inicio/dashboard', { replace: true });
    },
    onError: (error) => {
      toast.error(getRegisterErrorMessage(error));
    },
  });
  const isSubmitting = mutation.isPending;
  const cnpjRegistration = form.register('cnpj');

  function onSubmit(values: RegisterSchema) {
    mutation.mutate({
      tradeName: values.tradeName.trim(),
      cnpj: values.cnpj ? onlyDigits(values.cnpj) : null,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      captchaToken: values.captchaToken,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-slate-950 p-0 text-slate-100 sm:max-w-2xl">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-left">
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Building2 className="size-6" aria-hidden="true" />
            </div>
            <DialogTitle className="text-2xl font-extrabold text-white">
              Cadastrar negócio
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Crie o acesso inicial do negócio. O CNPJ é opcional e pode ser
              informado depois nos dados do negócio.
            </DialogDescription>
          </DialogHeader>
          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="register-trade-name" className="text-slate-200">
                Nome fantasia do negócio
              </Label>
              <Input
                id="register-trade-name"
                className="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
                disabled={isSubmitting}
                invalid={Boolean(form.formState.errors.tradeName)}
                placeholder="Ex.: Meu Negócio Avenida"
                {...form.register('tradeName')}
              />
              {form.formState.errors.tradeName ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.tradeName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-cnpj" className="text-slate-200">
                CNPJ
              </Label>
              <Input
                id="register-cnpj"
                className="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
                disabled={isSubmitting}
                inputMode="numeric"
                invalid={Boolean(form.formState.errors.cnpj)}
                maxLength={18}
                placeholder="Opcional"
                {...cnpjRegistration}
                onChange={(event) => {
                  event.target.value = formatCnpj(event.target.value);
                  cnpjRegistration.onChange(event);
                }}
              />
              {form.formState.errors.cnpj ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.cnpj.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email" className="text-slate-200">
                E-mail
              </Label>
              <Input
                id="register-email"
                autoComplete="email"
                className="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
                disabled={isSubmitting}
                invalid={Boolean(form.formState.errors.email)}
                placeholder="admin@empresa.com"
                type="email"
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <Controller
              control={form.control}
              name="password"
              render={({ field }) => (
                <PasswordField
                  id="register-password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  error={form.formState.errors.password?.message}
                  inputClassName="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
                  label="Senha"
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
                  id="register-confirm-password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  error={form.formState.errors.confirmPassword?.message}
                  inputClassName="border-white/10 bg-slate-800/80 text-white placeholder:text-slate-500"
                  label="Confirmar senha"
                  labelClassName="text-slate-200"
                  placeholder="Repita a senha"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={form.control}
              name="captchaToken"
              render={({ field }) => (
                <div className="sm:col-span-2">
                  <CaptchaField
                    disabled={isSubmitting}
                    error={form.formState.errors.captchaToken?.message}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </div>
              )}
            />
            <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-slate-800/80 text-slate-100 hover:bg-slate-800"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando cadastro...' : 'Criar cadastro'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
