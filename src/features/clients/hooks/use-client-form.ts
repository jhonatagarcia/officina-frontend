import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { clientSchema, type ClientSchema } from '@/features/clients/schemas/client-schema';
import { clientsService } from '@/features/clients/services/clients-service';
import { normalizeNullableString } from '@/lib/utils';
import { ApiErrorResponse } from '@/types/common';

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, '') ?? '';
}

function formatCpfCnpj(value: string | null | undefined) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function useClientForm(mode: 'create' | 'edit' | 'view', id: string, onSuccess: () => void) {
  const query = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientsService.getById(id),
    enabled: mode !== 'create',
  });

  const form = useForm<ClientSchema>({
    resolver: zodResolver(clientSchema),
    values:
      (query.data && {
        name: query.data.name,
        phone: onlyDigits(query.data.phone),
        document: formatCpfCnpj(query.data.document),
        email: query.data.email ?? '',
        notes: query.data.notes ?? '',
      }) ?? {
        name: '',
        phone: '',
        document: '',
        email: '',
        notes: '',
      },
  });

  const mutation = useMutation({
    mutationFn: async (values: ClientSchema) => {
      const payload = {
        name: values.name,
        phone: normalizeNullableString(onlyDigits(values.phone)),
        document: normalizeNullableString(onlyDigits(values.document)),
        email: normalizeNullableString(values.email),
        notes: normalizeNullableString(values.notes),
      };

      if (mode === 'edit') return clientsService.update(id, payload);
      return clientsService.create(payload);
    },
    onSuccess: () => {
      toast.success('Cliente salvo com sucesso.');
      onSuccess();
    },

    onError: (error: ApiErrorResponse) => {
    if (error.statusCode === 409) {
      form.setError('document', {
        type: 'server',
        message: error.message || 'Já existe um cliente cadastrado com este CPF/CNPJ.',
      });
      return;
    }

    toast.error(error.message || 'Não foi possível salvar o cliente.');
  },
  });

  return { query, form, mutation };
}
