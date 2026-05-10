import '@testing-library/jest-dom';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useAuthStore } from '@/store/auth-store';

beforeAll(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api');
  vi.stubEnv('VITE_APP_NAME', 'OficinaPro');
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  useAuthStore.setState({
    session: null,
    hydrated: true,
  });
});
