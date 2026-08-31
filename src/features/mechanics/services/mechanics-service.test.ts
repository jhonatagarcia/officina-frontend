import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mechanicsService, type MechanicPayload } from './mechanics-service';
import { http } from '@/services/api/http';

vi.mock('@/services/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const employee = {
  id: 'employee-1',
  name: 'Funcionario Sintetico',
  function: 'MECHANIC' as const,
  isActive: true,
  hasAccess: false,
  user: null,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

describe('mechanicsService employee contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    {
      label: 'sem acesso',
      payload: {
        name: 'Funcionario Sintetico Sem Acesso',
        function: 'MECHANIC',
        isActive: true,
      } satisfies MechanicPayload,
    },
    {
      label: 'com conta existente vinculada',
      payload: {
        name: 'Funcionario Sintetico Com Acesso',
        function: 'MECHANIC',
        isActive: true,
        userId: '11111111-1111-4111-8111-111111111111',
      } satisfies MechanicPayload,
    },
  ])('envia o formulario $label para POST /employees', async ({ payload }) => {
    vi.mocked(http.post).mockResolvedValueOnce({ data: employee });

    await mechanicsService.create(payload);

    expect(http.post).toHaveBeenCalledWith('/employees', payload);
    expect(http.post).not.toHaveBeenCalledWith('/mechanics', expect.anything());
  });

  it('usa /employees no CRUD administrativo e preserva /mechanics so na listagem operacional', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: {
          data: [employee],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [employee],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      });

    await mechanicsService.listEmployees({ page: 1, pageSize: 20 });
    await mechanicsService.list({ page: 1, pageSize: 20, active: true });

    expect(http.get).toHaveBeenNthCalledWith(1, '/employees', {
      params: { page: 1, limit: 20, function: 'MECHANIC' },
    });
    expect(http.get).toHaveBeenNthCalledWith(2, '/mechanics', {
      params: { page: 1, limit: 20, active: 'true' },
    });
  });
});
