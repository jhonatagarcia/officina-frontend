import axios from 'axios';
import { env } from '@/lib/env';
import { emitAuthEvent } from '@/features/auth/lib/auth-events';
import { useAuthStore } from '@/store/auth-store';
import type { ApiErrorResponse } from '@/types/common';

export const http = axios.create({
  baseURL: env.VITE_API_BASE_URL,
});

const defaultApiErrorMessage = 'Não foi possível processar a solicitação.';
const safeBackendMessageStatuses = new Set([400, 404, 409, 422]);

function normalizeMessageValue(message: unknown) {
  const value = Array.isArray(message) ? message[0] : message;
  if (typeof value !== 'string') return null;

  const withoutTags = value.replace(/<[^>]*>/g, '');
  const normalized = Array.from(withoutTags)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : character;
    })
    .join('')
    .trim();
  return normalized ? normalized.slice(0, 180) : null;
}

export function normalizeApiErrorResponse(status?: number, payload?: ApiErrorResponse): ApiErrorResponse {
  if (status === 401) {
    return {
      message: 'Sua sessão expirou. Faça login novamente.',
      statusCode: status,
    };
  }

  if (status === 403) {
    return {
      message: 'Você não possui permissão para executar esta ação.',
      statusCode: status,
    };
  }

  const safeBackendMessage = safeBackendMessageStatuses.has(status ?? 0)
    ? normalizeMessageValue(payload?.message)
    : null;

  return {
    message: safeBackendMessage ?? defaultApiErrorMessage,
    statusCode: status,
  };
}

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().session?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined;
    const payload = error.response?.data as ApiErrorResponse | undefined;
    const normalizedError = normalizeApiErrorResponse(status, payload);

    if (status === 401) {
      useAuthStore.getState().logout();
      emitAuthEvent({ type: 'SESSION_EXPIRED' });
    } else if (status === 403) {
      emitAuthEvent({ type: 'FORBIDDEN' });
    }

    return Promise.reject(normalizedError);
  },
);
