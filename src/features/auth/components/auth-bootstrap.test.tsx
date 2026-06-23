import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthBootstrap } from './auth-bootstrap';

const { setHydratedMock, silentRefreshMock, useAuthStoreMock } = vi.hoisted(() => {
  const state = {
    setHydrated: vi.fn(),
    silentRefresh: vi.fn(),
  };
  const useAuthStore = vi.fn((selector: (value: typeof state) => unknown) => selector(state)) as
    & ReturnType<typeof vi.fn>
    & { setState: ReturnType<typeof vi.fn> };
  useAuthStore.setState = vi.fn();

  return {
    setHydratedMock: state.setHydrated,
    silentRefreshMock: state.silentRefresh,
    useAuthStoreMock: useAuthStore,
  };
});

vi.mock('@/store/auth-store', () => ({
  useAuthStore: useAuthStoreMock,
}));

describe('AuthBootstrap', () => {
  beforeEach(() => {
    setHydratedMock.mockClear();
    silentRefreshMock.mockClear();
  });

  it('nao dispara refresh de sessao tenant nas rotas admin', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <AuthBootstrap />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(setHydratedMock).toHaveBeenCalledWith(true);
    });
    expect(silentRefreshMock).not.toHaveBeenCalled();
  });

  it('dispara refresh de sessao tenant nas demais rotas', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthBootstrap />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(silentRefreshMock).toHaveBeenCalledTimes(1);
    });
    expect(setHydratedMock).not.toHaveBeenCalled();
  });
});
