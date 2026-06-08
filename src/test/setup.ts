import '@testing-library/jest-dom';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api');
vi.stubEnv('VITE_APP_NAME', 'OficinaPro');
vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'google-client-id.test.apps.googleusercontent.com');

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(async () => {
  cleanup();
  sessionStorage.clear();
  const { useAuthStore } = await import('@/store/auth-store');
  useAuthStore.setState({
    session: null,
    hydrated: true,
  });
});
