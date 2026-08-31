import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PasswordField } from '@/features/auth/components/password-field';
import {
  accessUserRoles,
  accessUserSchema,
  type AccessUserSchema,
} from '@/features/users/schemas/access-user-schema';
import { usersService } from '@/features/users/services/users-service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const roleLabels = {
  ADMIN: 'Administrador',
  ATENDENTE: 'Atendente',
  MECANICO: 'Mecânico',
  FINANCEIRO: 'Financeiro',
};

interface CreateAccessUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAccessUserDialog({
  open,
  onOpenChange,
}: CreateAccessUserDialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<AccessUserSchema>({
    resolver: zodResolver(accessUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'MECANICO',
    },
  });
  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof usersService.create>[0]) =>
      usersService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios-acesso'] });
      toast.success('Conta de acesso criada com sucesso.');
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Não foi possível criar a conta. Revise os dados e tente novamente.');
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !mutation.isPending) {
      form.reset();
    }
    onOpenChange(nextOpen);
  }

  function onSubmit(values: AccessUserSchema) {
    mutation.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      role: values.role,
      isActive: true,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova conta de acesso</DialogTitle>
          <DialogDescription>
            A conta será criada ativa com a senha definida aqui pelo administrador.
            Este fluxo não envia convite e não gera senha automática.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="access-user-name">Nome</Label>
            <Input
              id="access-user-name"
              disabled={mutation.isPending}
              invalid={Boolean(form.formState.errors.name)}
              {...form.register('name')}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-user-email">E-mail</Label>
            <Input
              id="access-user-email"
              autoComplete="email"
              disabled={mutation.isPending}
              invalid={Boolean(form.formState.errors.email)}
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
            name="role"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select
                  disabled={mutation.isPending}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger aria-label="Papel">
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessUserRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field }) => (
              <PasswordField
                id="access-user-password"
                autoComplete="new-password"
                disabled={mutation.isPending}
                error={form.formState.errors.password?.message}
                label="Senha inicial"
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
                id="access-user-confirm-password"
                autoComplete="new-password"
                disabled={mutation.isPending}
                error={form.formState.errors.confirmPassword?.message}
                label="Confirmar senha"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Criando...' : 'Criar conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
