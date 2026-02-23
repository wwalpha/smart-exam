const AUTH_TOKEN_STORAGE_KEY = 'smart_exam_access_token';

export type CognitoUserRole = 'ADMIN' | 'USER';

const normalizeDomain = (domain: string): string => {
  const trimmed = domain.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/$/, '');
  }
  return `https://${trimmed.replace(/\/$/, '')}`;
};

export const isAuthEnabled = (): boolean => {
  const enabledFlag = String(import.meta.env.VITE_ENABLE_AUTH ?? '').trim() === '1';
  if (!enabledFlag) return false;
  const authority = getCognitoAuthority();
  const clientId = String(import.meta.env.VITE_COGNITO_CLIENT_ID ?? '').trim();
  const redirectUri = String(import.meta.env.VITE_COGNITO_REDIRECT_URI ?? '').trim();
  return authority.length > 0 && clientId.length > 0 && redirectUri.length > 0;
};

export const getCognitoAuthority = (): string => {
  const explicitAuthority = String(import.meta.env.VITE_COGNITO_AUTHORITY ?? '').trim();
  if (explicitAuthority.length > 0) {
    return explicitAuthority;
  }

  const userPoolId = String(import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '').trim();
  const region = String(import.meta.env.VITE_AWS_REGION ?? 'ap-northeast-1').trim();
  if (userPoolId.length > 0 && region.length > 0) {
    return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  }

  return normalizeDomain(String(import.meta.env.VITE_COGNITO_DOMAIN ?? ''));
};

export const getOidcClientConfig = () => {
  return {
    authority: getCognitoAuthority(),
    client_id: String(import.meta.env.VITE_COGNITO_CLIENT_ID ?? '').trim(),
    redirect_uri: String(import.meta.env.VITE_COGNITO_REDIRECT_URI ?? '').trim(),
    response_type: 'code',
    scope: 'openid profile email',
  };
};

export const getStoredAccessToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = atob(padded);
    const payload = JSON.parse(decoded);
    if (payload && typeof payload === 'object') {
      return payload as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
};

const toRoleFromClaims = (payload: Record<string, unknown>): CognitoUserRole => {
  const groupsClaim = payload['cognito:groups'];
  const groups = Array.isArray(groupsClaim)
    ? groupsClaim.filter((item): item is string => typeof item === 'string')
    : typeof groupsClaim === 'string'
      ? [groupsClaim]
      : [];

  return groups.some((group) => group.toUpperCase() === 'ADMIN') ? 'ADMIN' : 'USER';
};

export const getCurrentUserRole = (): CognitoUserRole => {
  if (!isAuthEnabled()) return 'ADMIN';
  const token = getStoredAccessToken();
  if (!token) return 'USER';
  const payload = parseJwtPayload(token);
  if (!payload) return 'USER';
  return toRoleFromClaims(payload);
};

export const setStoredAccessToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearStoredAccessToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const buildManagedLogoutUrl = (): string => {
  const domain = normalizeDomain(String(import.meta.env.VITE_COGNITO_DOMAIN ?? ''));
  const clientId = String(import.meta.env.VITE_COGNITO_CLIENT_ID ?? '').trim();
  const redirectUri = String(import.meta.env.VITE_COGNITO_REDIRECT_URI ?? '').trim();

  const query = new URLSearchParams({
    client_id: clientId,
    logout_uri: redirectUri,
  });

  return `${domain}/logout?${query.toString()}`;
};
