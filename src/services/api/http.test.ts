import { describe, expect, it, vi } from 'vitest';
import { subscribeAuthEvent } from '@/features/auth/lib/auth-events';
import { http, normalizeApiErrorResponse } from '@/services/api/http';
import { useAuthStore } from '@/store/auth-store';

function rejectWithStatus(status: number, message = 'backend detail') {
  return vi.fn().mockRejectedValue({
    response: {
      status,
      data: {
        message,
        statusCode: status,
      },
    },
  });
}

describe('normalizeApiErrorResponse', () => {
  it('usa mensagens genericas para erros de autenticacao e autorizacao', () => {
    expect(normalizeApiErrorResponse(401, { message: 'token jwt invalido: abc.def' })).toEqual({
      message: 'Sua sessão expirou. Faça login novamente.',
      statusCode: 401,
    });
    expect(normalizeApiErrorResponse(403, { message: 'role ADMIN required' })).toEqual({
      message: 'Você não possui permissão para executar esta ação.',
      statusCode: 403,
    });
  });

  it('sanitiza mensagens de validacao permitidas pelo backend', () => {
    expect(normalizeApiErrorResponse(409, { message: '<b>CPF ja cadastrado</b>\nDetalhe' })).toEqual({
      message: 'CPF ja cadastrado Detalhe',
      statusCode: 409,
    });
  });

  it('nao repassa detalhes de erros inesperados', () => {
    expect(normalizeApiErrorResponse(500, { message: 'Database host internal.local falhou' })).toEqual({
      message: 'Não foi possível processar a solicitação.',
      statusCode: 500,
    });
  });

  it('limpa sessao e emite evento de expiracao quando a API retorna 401', async () => {
    const events: string[] = [];
    const unsubscribe = subscribeAuthEvent((event) => events.push(event.type));
    useAuthStore.getState().setSession({
      accessToken: 'token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
      },
    });

    await expect(
      http.get('/rota-protegida', {
        adapter: rejectWithStatus(401, 'jwt expired with internal detail'),
      }),
    ).rejects.toEqual({
      message: 'Sua sessão expirou. Faça login novamente.',
      statusCode: 401,
    });

    expect(useAuthStore.getState().session).toBeNull();
    expect(events).toEqual(['SESSION_EXPIRED']);

    unsubscribe();
  });

  it('nao recarrega a tela nem emite expiracao quando login retorna 401', async () => {
    window.history.pushState({}, '', '/login');
    const events: string[] = [];
    const unsubscribe = subscribeAuthEvent((event) => events.push(event.type));
    const state = useAuthStore.getState();
    const silentRefreshSpy = vi.spyOn(state, 'silentRefresh');
    state.setSession({
      accessToken: 'token-antigo',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
      },
    });

    await expect(
      http.post(
        '/auth/login',
        { email: 'naoexiste@local.com', password: 'Senha123' },
        { adapter: rejectWithStatus(401, 'Credenciais invalidas') },
      ),
    ).rejects.toEqual({
      message: 'Sua sessão expirou. Faça login novamente.',
      statusCode: 401,
    });

    expect(silentRefreshSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().session?.accessToken).toBe('token-antigo');
    expect(events).toEqual([]);

    silentRefreshSpy.mockRestore();
    unsubscribe();
  });

  it('nao tenta refresh tenant nem emite expiracao em rotas admin', async () => {
    window.history.pushState({}, '', '/admin/dashboard');
    const events: string[] = [];
    const unsubscribe = subscribeAuthEvent((event) => events.push(event.type));
    const state = useAuthStore.getState();
    const silentRefreshSpy = vi.spyOn(state, 'silentRefresh');
    state.setSession({
      accessToken: 'token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
      },
    });

    await expect(
      http.get('/rota-protegida', {
        adapter: rejectWithStatus(401, 'jwt expired with internal detail'),
      }),
    ).rejects.toEqual({
      message: 'Sua sessão expirou. Faça login novamente.',
      statusCode: 401,
    });

    expect(silentRefreshSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().session?.accessToken).toBe('token');
    expect(events).toEqual([]);

    silentRefreshSpy.mockRestore();
    unsubscribe();
  });

  it('emite evento de acesso negado sem limpar sessao quando a API retorna 403', async () => {
    const events: string[] = [];
    const unsubscribe = subscribeAuthEvent((event) => events.push(event.type));
    useAuthStore.getState().setSession({
      accessToken: 'token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@oficina.com',
        role: 'ADMIN',
      },
    });

    await expect(
      http.get('/rota-sem-permissao', {
        adapter: rejectWithStatus(403, 'role ADMIN required'),
      }),
    ).rejects.toEqual({
      message: 'Você não possui permissão para executar esta ação.',
      statusCode: 403,
    });

    expect(useAuthStore.getState().session?.accessToken).toBe('token');
    expect(events).toEqual(['FORBIDDEN']);

    unsubscribe();
  });
});
