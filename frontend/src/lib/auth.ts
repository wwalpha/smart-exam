const AUTH_TOKEN_STORAGE_KEY = 'smart_exam_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'smart_exam_refresh_token';
let refreshAccessTokenPromise: Promise<string | null> | null = null;

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

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
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

export const setStoredRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
};

export const clearStoredAccessToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const clearStoredRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

export const clearStoredAuthTokens = (): void => {
  clearStoredAccessToken();
  clearStoredRefreshToken();
};

type RefreshTokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
};

const refreshAccessTokenInternal = async (): Promise<string | null> => {
  const domain = normalizeDomain(String(import.meta.env.VITE_COGNITO_DOMAIN ?? ''));
  const clientId = String(import.meta.env.VITE_COGNITO_CLIENT_ID ?? '').trim();
  const refreshToken = getStoredRefreshToken();
  if (!isAuthEnabled() || !domain || !clientId || !refreshToken) return null;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    clearStoredAuthTokens();
    return null;
  }

  const data = (await response.json()) as RefreshTokenResponse;
  if (typeof data.access_token !== 'string' || data.access_token.length === 0) {
    clearStoredAuthTokens();
    return null;
  }

  setStoredAccessToken(data.access_token);
  if (typeof data.refresh_token === 'string' && data.refresh_token.length > 0) {
    setStoredRefreshToken(data.refresh_token);
  }
  return data.access_token;
};

export const refreshStoredAccessToken = async (): Promise<string | null> => {
  if (!refreshAccessTokenPromise) {
    // 複数 API が同時に 401 を返したときでも refresh API 呼び出しは 1 回に抑える。
    refreshAccessTokenPromise = refreshAccessTokenInternal().finally(() => {
      refreshAccessTokenPromise = null;
    });
  }
  return refreshAccessTokenPromise;
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
