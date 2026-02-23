const AUTH_TOKEN_STORAGE_KEY = 'smart_exam_access_token';

const normalizeDomain = (domain: string): string => {
  const trimmed = domain.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/$/, '');
  }
  return `https://${trimmed.replace(/\/$/, '')}`;
};

export const isAuthEnabled = (): boolean => {
  if (!import.meta.env.PROD) return false;
  const enabledFlag = String(import.meta.env.VITE_ENABLE_AUTH ?? '').trim() === '1';
  if (!enabledFlag) return false;
  const domain = normalizeDomain(String(import.meta.env.VITE_COGNITO_DOMAIN ?? ''));
  const clientId = String(import.meta.env.VITE_COGNITO_CLIENT_ID ?? '').trim();
  const redirectUri = String(import.meta.env.VITE_COGNITO_REDIRECT_URI ?? '').trim();
  return domain.length > 0 && clientId.length > 0 && redirectUri.length > 0;
};

export const getStoredAccessToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

export const setStoredAccessToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearStoredAccessToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const buildManagedLoginUrl = (): string => {
  const domain = normalizeDomain(String(import.meta.env.VITE_COGNITO_DOMAIN ?? ''));
  const clientId = String(import.meta.env.VITE_COGNITO_CLIENT_ID ?? '').trim();
  const redirectUri = String(import.meta.env.VITE_COGNITO_REDIRECT_URI ?? '').trim();

  const query = new URLSearchParams({
    response_type: 'token',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email profile',
  });

  return `${domain}/oauth2/authorize?${query.toString()}`;
};

export const persistTokenFromCallbackHash = (hash: string): boolean => {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  const accessToken = params.get('access_token')?.trim() ?? '';
  if (!accessToken) return false;
  setStoredAccessToken(accessToken);
  return true;
};
