import axios, { AxiosError } from 'axios';
import { env } from '@/lib/env';
import { normalizeApiErrorResponse } from '@/services/api/http';
import type { ApiErrorResponse } from '@/types/common';
import { useAdminAuth } from '../auth/useAdminAuth';

export const adminApi = axios.create({
  baseURL: `${env.VITE_API_BASE_URL}/admin`,
  timeout: 10_000,
});

adminApi.interceptors.request.use((config) => {
  const token = useAdminAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status as number | undefined;
    const requestUrl = error.config?.url ?? '';
    const isAdminAuthRequest = requestUrl.includes('/auth/');

    if (status === 401) {
      useAdminAuth.getState().logout();

      if (!isAdminAuthRequest) {
        window.location.replace('/admin/login');
      }
    }

    return Promise.reject(
      normalizeApiErrorResponse(status, error.response?.data as ApiErrorResponse | undefined),
    );
  },
);
