export function isValidGoogleClientId(clientId: string) {
  const normalizedClientId = clientId.trim();

  return (
    /^[^\s@]+\.apps\.googleusercontent\.com$/.test(normalizedClientId) &&
    !normalizedClientId.startsWith('local-google-client-id') &&
    !normalizedClientId.startsWith('SUBSTITUA_')
  );
}

function parseAllowedOrigins(allowedOrigins: string) {
  return allowedOrigins
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/g, ''))
    .filter(Boolean);
}

export function canUseGoogleSignIn(clientId: string, allowedOrigins: string) {
  if (!isValidGoogleClientId(clientId)) {
    return false;
  }

  const origins = parseAllowedOrigins(allowedOrigins);
  if (origins.length === 0) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return origins.includes(window.location.origin.replace(/\/+$/g, ''));
}

export function getGoogleSignInUnavailableReason(clientId: string, allowedOrigins: string) {
  if (!isValidGoogleClientId(clientId)) {
    return 'invalid_client_id' as const;
  }

  if (!canUseGoogleSignIn(clientId, allowedOrigins)) {
    return 'origin_not_allowed' as const;
  }

  return undefined;
}
