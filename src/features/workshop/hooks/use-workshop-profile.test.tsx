import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { vi } from 'vitest';
import { useWorkshopProfile } from '@/features/workshop/hooks/use-workshop-profile';
import { useAuthStore } from '@/store/auth-store';

const { getProfileMock } = vi.hoisted(() => ({ getProfileMock: vi.fn() }));

vi.mock('@/features/workshop/services/workshop-service', () => ({
  workshopService: { getProfile: getProfileMock },
}));

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function ProfileProbe() {
  const profile = useWorkshopProfile();

  if (profile.isLoading) return <p>Carregando perfil</p>;
  if (profile.isError) {
    return (
      <>
        <p>Não foi possível carregar o perfil da oficina.</p>
        <button type="button" onClick={() => void profile.refetch()}>
          Tentar novamente
        </button>
      </>
    );
  }

  return <p>{profile.data?.tradeName}</p>;
}

function renderProfileProbe() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<ProfileProbe />, { wrapper: createWrapper(queryClient) });
}

describe('useWorkshopProfile', () => {
  beforeEach(() => {
    getProfileMock.mockReset();
    useAuthStore.getState().setSession({
      accessToken: 'test-access-token',
      user: { id: 'user-1', name: 'Ana', email: 'ana@example.test', role: 'ADMIN' },
    });
  });

  it('expõe carregamento e o perfil carregado com sucesso', async () => {
    let resolveProfile: (profile: { id: string; tradeName: string }) => void;
    getProfileMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveProfile = resolve;
      }),
    );

    renderProfileProbe();

    expect(screen.getByText('Carregando perfil')).toBeInTheDocument();
    resolveProfile!({ id: 'workshop-1', tradeName: 'Oficina Central' });

    expect(await screen.findByText('Oficina Central')).toBeInTheDocument();
  });

  it('mantém o erro técnico fora da interface e permite tentar novamente', async () => {
    getProfileMock
      .mockRejectedValueOnce(new Error('DATABASE_URL=postgresql://secret'))
      .mockResolvedValueOnce({ id: 'workshop-1', tradeName: 'Oficina Recuperada' });

    renderProfileProbe();

    expect(await screen.findByText('Não foi possível carregar o perfil da oficina.')).toBeInTheDocument();
    expect(screen.queryByText(/DATABASE_URL/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(getProfileMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Oficina Recuperada')).toBeInTheDocument();
  });
});
