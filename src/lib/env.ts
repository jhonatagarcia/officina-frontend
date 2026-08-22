/// <reference types="vite/client" />
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().trim().url(),
  VITE_APP_NAME: z.string().trim().default('AutoPro System'),
  VITE_GOOGLE_CLIENT_ID: z.string().trim().default(''),
  VITE_GOOGLE_ALLOWED_ORIGINS: z.string().trim().default(''),
  VITE_RECAPTCHA_SITE_KEY: z.string().trim().default(''),
  VITE_ADMIN_PANEL_ENABLED: z
    .string()
    .trim()
    .default('false')
    .transform((value) => value === 'true'),
});

const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
const defaultApiBaseUrl = viteEnv?.PROD
  ? 'https://autoprosystem.com.br/api/v1'
  : 'http://localhost:3000/api/v1';
const defaultAdminPanelEnabled = viteEnv?.PROD ? 'false' : 'true';

function readEnv(key: string): string | undefined {
  const value = viteEnv?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export const env = envSchema.parse({
  VITE_API_BASE_URL: readEnv('VITE_API_BASE_URL') ?? defaultApiBaseUrl,
  VITE_APP_NAME: readEnv('VITE_APP_NAME') ?? 'AutoPro System',
  VITE_GOOGLE_CLIENT_ID: readEnv('VITE_GOOGLE_CLIENT_ID') ?? '',
  VITE_GOOGLE_ALLOWED_ORIGINS: readEnv('VITE_GOOGLE_ALLOWED_ORIGINS') ?? '',
  VITE_RECAPTCHA_SITE_KEY: readEnv('VITE_RECAPTCHA_SITE_KEY') ?? '',
  VITE_ADMIN_PANEL_ENABLED: readEnv('VITE_ADMIN_PANEL_ENABLED') ?? defaultAdminPanelEnabled,
});
