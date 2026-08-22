import { fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { vi } from 'vitest';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/store/auth-store';
import { renderWithProviders } from '@/test/render-with-providers';

const { meMock } = vi.hoisted(() => ({
  meMock: vi.fn(),
}));

vi.mock('@/features/auth/services/auth-service', () => ({
  authService: {
    me: meMock,
  },
}));

const axiosPostSpy = vi.spyOn(axios, 'post');

describe('Sidebar', () => {
  beforeEach(() => {
    axiosPostSpy.mockResolvedValue({ data: undefined });
  });

  it('renderiza menus restritos com cadeado para perfil financeiro', () => {
    const user = {
      id: '1',
      name: 'Financeiro',
      email: 'financeiro@oficina.com',
      role: 'FINANCEIRO' as const,
    };
    useAuthStore.setState({
      hydrated: true,
      session: {
        accessToken: '',
        user,
      },
    });
    meMock.mockResolvedValue(user);

    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getAllByText('Financeiro').length).toBeGreaterThan(0);
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Estoque')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Acesso bloqueado').length).toBeGreaterThan(
      0,
    );
  });

  it('renderiza todos os menus liberados para administrador', () => {
    const user = {
      id: '1',
      name: 'Admin',
      email: 'admin@oficina.com',
      role: 'ADMIN' as const,
    };
    useAuthStore.setState({
      hydrated: true,
      session: {
        accessToken: '',
        user,
      },
    });
    meMock.mockResolvedValue(user);

    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.getByText('Mecânicos')).toBeInTheDocument();
    expect(screen.queryByLabelText('Acesso bloqueado')).not.toBeInTheDocument();
  });

  it('exibe o nome fantasia no rodape e permite sair pelo menu', async () => {
    const user = {
      id: '1',
      name: 'Admin',
      email: 'admin@oficina.com',
      role: 'ADMIN' as const,
      workshop: {
        tradeName: 'Oficina Paiva',
      },
    };
    useAuthStore.setState({
      hydrated: true,
      session: {
        accessToken: '',
        user,
      },
    });
    meMock.mockResolvedValue(user);

    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Oficina Paiva')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sair/i }));

    await waitFor(() => expect(useAuthStore.getState().session).toBeNull());
  });
});
