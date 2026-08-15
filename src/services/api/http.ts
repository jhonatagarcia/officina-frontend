import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/lib/env';
import { emitAuthEvent } from '@/features/auth/lib/auth-events';
import { useAuthStore } from '@/store/auth-store';
import type { ApiErrorResponse } from '@/types/common';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _skipRefreshRetry?: boolean;
    _retried?: boolean;
  }
}

export const http = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
});

const defaultApiErrorMessage = 'Não foi possível processar a solicitação.';
const safeBackendMessageStatuses = new Set([400, 404, 409, 422]);
const safeConflictMetadata = new Map<
  string,
  'name' | 'code' | 'internalCode' | null
>([
  ['INVENTORY_INTERNAL_CODE_CONFLICT', 'internalCode'],
  ['INVENTORY_CONFLICT', null],
  ['SERVICE_CODE_CONFLICT', 'code'],
  ['SERVICE_NAME_CATEGORY_CONFLICT', 'name'],
  ['SERVICE_CONFLICT', null],
]);
type ApiErrorPayload = {
  message?: unknown;
  statusCode?: number | undefined;
  code?: unknown;
  field?: unknown;
};

function isAdminRoute() {
  return (
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/admin')
  );
}

function isLoginRoute() {
  return typeof window !== 'undefined' && window.location.pathname === '/login';
}

function isAuthRequest(config?: InternalAxiosRequestConfig) {
  const url = config?.url ?? '';
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/google')
  );
}

function normalizeMessageValue(message: unknown) {
  const values = (Array.isArray(message) ? message : [message]).filter(
    (value): value is string => typeof value === 'string',
  );
  const normalized = values
    .slice(0, 3)
    .map((value) =>
      Array.from(value.replace(/<[^>]*>/g, ''))
        .map((character) => {
          const code = character.charCodeAt(0);
          return code < 32 || code === 127 ? ' ' : character;
        })
        .join('')
        .trim(),
    )
    .filter(Boolean)
    .join(' ');
  return normalized ? normalized.slice(0, 180) : null;
}

export function normalizeApiErrorResponse(
  status?: number,
  payload?: ApiErrorPayload,
): ApiErrorResponse {
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
  const conflictCode =
    status === 409 &&
    typeof payload?.code === 'string' &&
    safeConflictMetadata.has(payload.code)
      ? payload.code
      : undefined;
  const expectedField = conflictCode
    ? safeConflictMetadata.get(conflictCode)
    : undefined;
  const conflictField =
    expectedField && payload?.field === expectedField ? expectedField : undefined;

  return {
    message: safeBackendMessage ?? defaultApiErrorMessage,
    ...(status !== undefined ? { statusCode: status } : {}),
    ...(conflictCode ? { code: conflictCode } : {}),
    ...(conflictField ? { field: conflictField } : {}),
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
  async (error: AxiosError) => {
    const status = error.response?.status as number | undefined;
    const original = error.config as InternalAxiosRequestConfig | undefined;

    if (
      status === 401 &&
      original &&
      !original._retried &&
      !original._skipRefreshRetry &&
      !isAuthRequest(original) &&
      !isLoginRoute() &&
      !isAdminRoute()
    ) {
      original._retried = true;
      const refreshed = await useAuthStore.getState().silentRefresh();

      if (refreshed) {
        const token = useAuthStore.getState().session?.accessToken;
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
        }
        return http(original);
      }

      useAuthStore.getState().setSession(null);
      emitAuthEvent({ type: 'SESSION_EXPIRED' });
      window.location.replace('/login');
      return Promise.reject(
        normalizeApiErrorResponse(
          status,
          error.response?.data as ApiErrorPayload | undefined,
        ),
      );
    }

    const payload = error.response?.data as ApiErrorPayload | undefined;
    const normalizedError = normalizeApiErrorResponse(status, payload);

    if (
      status === 401 &&
      !isAdminRoute() &&
      !isLoginRoute() &&
      !isAuthRequest(original)
    ) {
      useAuthStore.getState().setSession(null);
      emitAuthEvent({ type: 'SESSION_EXPIRED' });
    } else if (status === 403) {
      emitAuthEvent({ type: 'FORBIDDEN' });
    }

    return Promise.reject(normalizedError);
  },
);
