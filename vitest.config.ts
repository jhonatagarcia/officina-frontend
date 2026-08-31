import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      // Bootstrap, tipagens e a infraestrutura dos próprios testes não representam comportamento de produto.
      exclude: ['src/main.tsx', 'src/**/*.d.ts', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
    },
  },
});
