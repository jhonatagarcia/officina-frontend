/// <reference types="vite/client" />
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_APP_NAME: z.string().default('OficinaPro'),
});

const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;

export const env = envSchema.parse({
  VITE_API_BASE_URL: viteEnv?.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
  VITE_APP_NAME: viteEnv?.VITE_APP_NAME ?? 'OficinaPro',
});
