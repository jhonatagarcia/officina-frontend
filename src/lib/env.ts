/// <reference types="vite/client" />
import { z } from 'zod';

const apiBaseUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
    'VITE_API_BASE_URL deve ser uma URL absoluta ou um caminho relativo iniciado por /',
  );

const envSchema = z.object({
  VITE_API_BASE_URL: apiBaseUrlSchema,
  VITE_APP_NAME: z.string().trim().default('AutoPro System'),
  VITE_GOOGLE_CLIENT_ID: z.string().trim().default(''),
  VITE_ADMIN_PANEL_ENABLED: z
    .string()
    .trim()
    .default('false')
    .transform((value) => value === 'true'),
});

const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
const defaultApiBaseUrl = viteEnv?.PROD ? '/api/v1' : 'http://localhost:3000/api/v1';

export const env = envSchema.parse({
  VITE_API_BASE_URL: viteEnv?.['VITE_API_BASE_URL'] ?? defaultApiBaseUrl,
  VITE_APP_NAME: viteEnv?.['VITE_APP_NAME'] ?? 'AutoPro System',
  VITE_GOOGLE_CLIENT_ID: viteEnv?.['VITE_GOOGLE_CLIENT_ID'] ?? '',
  VITE_ADMIN_PANEL_ENABLED: viteEnv?.['VITE_ADMIN_PANEL_ENABLED'] ?? 'false',
});
