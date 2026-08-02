import { renderHook } from '@testing-library/react';
import { beforeEach, expect, vi } from 'vitest';
import { useRecaptcha } from '@/features/auth/hooks/use-recaptcha';

const { envMock } = vi.hoisted(() => ({
  envMock: { VITE_RECAPTCHA_SITE_KEY: '' },
}));

vi.mock('@/lib/env', () => ({ env: envMock }));

interface RecaptchaDouble {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

function setRecaptcha(recaptcha?: RecaptchaDouble) {
  Object.defineProperty(window, 'grecaptcha', {
    configurable: true,
    value: recaptcha,
  });
}

describe('useRecaptcha', () => {
  beforeEach(() => {
    envMock.VITE_RECAPTCHA_SITE_KEY = '';
    setRecaptcha();
  });

  it('não tenta carregar script quando o reCAPTCHA está indisponível na configuração', async () => {
    const appendChild = vi.spyOn(document.head, 'appendChild');
    const { result } = renderHook(() => useRecaptcha());

    await expect(result.current('login')).resolves.toBeUndefined();
    expect(appendChild).not.toHaveBeenCalled();
    appendChild.mockRestore();
  });

  it('preserva token ausente retornado pelo mock local, sem chamar serviço externo', async () => {
    envMock.VITE_RECAPTCHA_SITE_KEY = 'local-test-key';
    const execute = vi.fn().mockResolvedValue('');
    setRecaptcha({ ready: (callback) => callback(), execute });
    const { result } = renderHook(() => useRecaptcha());

    await expect(result.current('login')).resolves.toBe('');
    expect(execute).toHaveBeenCalledWith('local-test-key', { action: 'login' });
  });

  it('retorna token válido do mock local', async () => {
    envMock.VITE_RECAPTCHA_SITE_KEY = 'local-test-key';
    const execute = vi.fn().mockResolvedValue('local-captcha-token');
    setRecaptcha({ ready: (callback) => callback(), execute });
    const { result } = renderHook(() => useRecaptcha());

    await expect(result.current('register')).resolves.toBe('local-captcha-token');
    expect(execute).toHaveBeenCalledWith('local-test-key', { action: 'register' });
  });

  it('propaga falha do mock local de forma segura', async () => {
    envMock.VITE_RECAPTCHA_SITE_KEY = 'local-test-key';
    setRecaptcha({
      ready: (callback) => callback(),
      execute: vi.fn().mockRejectedValue(new Error('recaptcha_test_failure')),
    });
    const { result } = renderHook(() => useRecaptcha());

    await expect(result.current('login')).rejects.toThrow('recaptcha_test_failure');
  });
});
