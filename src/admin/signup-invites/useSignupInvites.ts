import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/admin/api/admin-api';

export type SignupInviteStatus = 'ACTIVE' | 'USED' | 'REVOKED' | 'EXPIRED';

export interface SignupInvite {
  id: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  consumedByWorkshopId: string | null;
  createdAt: string;
  status: SignupInviteStatus;
}

export interface CreatedSignupInvite {
  id: string;
  email: string;
  expiresAt: string;
  createdAt: string;
  inviteUrl: string;
}

export function useSignupInvites() {
  return useQuery({
    queryKey: ['admin', 'signup-invites'],
    queryFn: () =>
      adminApi
        .get<SignupInvite[]>('/signup-invites')
        .then((response) => response.data),
  });
}

export function useCreateSignupInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      adminApi
        .post<CreatedSignupInvite>('/signup-invites', { email })
        .then((response) => response.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'signup-invites'] }),
  });
}

export function useRevokeSignupInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.delete(`/signup-invites/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'signup-invites'] }),
  });
}
