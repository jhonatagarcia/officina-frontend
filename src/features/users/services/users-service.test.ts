import { describe, expect, it, vi } from 'vitest';
import { usersService } from './users-service';
import { http } from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  http: { get: vi.fn(), post: vi.fn() },
}));

describe('usersService account filters', () => {
  it('envia o papel MECANICO ao buscar contas vinculaveis', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        data: [],
        meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
      },
    });

    await usersService.list({
      page: 1,
      pageSize: 100,
      active: true,
      role: 'MECANICO',
      eligibleForEmployee: true,
    });

    expect(http.get).toHaveBeenCalledWith('/users', {
      params: {
        page: 1,
        limit: 100,
        active: 'true',
        role: 'MECANICO',
        eligibleForEmployee: 'true',
      },
    });
  });

  it('creates an active MECANICO account with an administrator-defined password', async () => {
    const payload = {
      name: 'Synthetic account',
      email: 'mechanic@example.test',
      password: 'SyntheticPassword123!',
      role: 'MECANICO' as const,
      isActive: true as const,
    };
    vi.mocked(http.post).mockResolvedValueOnce({ data: { id: 'user-1', ...payload } });

    await usersService.create(payload);

    expect(http.post).toHaveBeenCalledWith('/users', payload);
  });
});
