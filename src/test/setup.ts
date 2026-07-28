import '@testing-library/jest-dom';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api');
vi.stubEnv('VITE_APP_NAME', 'OficinaPro');
vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'google-client-id.test.apps.googleusercontent.com');
vi.stubEnv('VITE_GOOGLE_ALLOWED_ORIGINS', 'http://localhost:3000');

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();

  // O JSDOM não implementa a API de captura de ponteiro usada pelo Select do Radix.
  // No navegador ela existe; este polyfill mantém o teste exercitando o componente real.
  if (!Element.prototype.hasPointerCapture) {
    Object.defineProperties(Element.prototype, {
      hasPointerCapture: { configurable: true, value: () => false },
      setPointerCapture: { configurable: true, value: () => undefined },
      releasePointerCapture: { configurable: true, value: () => undefined },
    });
  }
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
