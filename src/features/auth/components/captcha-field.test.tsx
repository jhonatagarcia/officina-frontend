import { render, waitFor } from '@testing-library/react';
import { beforeEach, expect, vi } from 'vitest';
import { CaptchaField } from '@/features/auth/components/captcha-field';

const { envMock } = vi.hoisted(() => ({
  envMock: { VITE_RECAPTCHA_SITE_KEY: 'recaptcha-v2-site-key' },
}));

vi.mock('@/lib/env', () => ({ env: envMock }));

describe('CaptchaField', () => {
  beforeEach(() => {
    document.querySelectorAll('script[data-recaptcha-v2]').forEach((script) => script.remove());
    Object.defineProperty(window, 'grecaptcha', {
      configurable: true,
      value: undefined,
    });
  });

  it('aguarda a API do Google ficar disponível antes de renderizar o widget', async () => {
    const renderWidget = vi.fn(() => 1);
    const onChange = vi.fn();

    render(<CaptchaField value="" onChange={onChange} />);

    window.setTimeout(() => {
      Object.defineProperty(window, 'grecaptcha', {
        configurable: true,
        value: {
          render: renderWidget,
          reset: vi.fn(),
        },
      });
    }, 10);

    await waitFor(() => expect(renderWidget).toHaveBeenCalledOnce());
    expect(renderWidget).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ sitekey: 'recaptcha-v2-site-key' }),
    );
  });
});
