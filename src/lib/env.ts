/// <reference types="vite/client" />
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().trim().url(),
  VITE_APP_NAME: z.string().trim().default('AutoPro System'),
  VITE_GOOGLE_CLIENT_ID: z.string().trim().default(''),
  VITE_ADMIN_PANEL_ENABLED: z
    .string()
    .trim()
    .default('false')
    .transform((value) => value === 'true'),
});

const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;

export const env = envSchema.parse({
  VITE_API_BASE_URL: viteEnv?.['VITE_API_BASE_URL'] ?? 'http://localhost:3000/api/v1',
  VITE_APP_NAME: viteEnv?.['VITE_APP_NAME'] ?? 'AutoPro System',
  VITE_GOOGLE_CLIENT_ID: viteEnv?.['VITE_GOOGLE_CLIENT_ID'] ?? '',
  VITE_ADMIN_PANEL_ENABLED: viteEnv?.['VITE_ADMIN_PANEL_ENABLED'] ?? 'false',
});
