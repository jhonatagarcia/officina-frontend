import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';

describe('GoogleSignInButton', () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    fetchMock.mockClear();
    consoleErrorMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('envia erro de client id invalido para o log do backend', async () => {
    const onGoogleError = vi.fn();

    render(
      <GoogleSignInButton
        clientId="local-google-client-id"
        onCredential={vi.fn()}
        onGoogleError={onGoogleError}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /entrar ou cadastrar com google/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/google/identity-issue',
        expect.objectContaining({
          method: 'POST',
          keepalive: true,
          body: JSON.stringify({
            reason: 'invalid_client_id',
            origin: window.location.origin,
          }),
        }),
      );
    });
    expect(onGoogleError).toHaveBeenCalledWith('invalid_client_id');
  });
});
