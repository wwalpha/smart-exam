import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { Button } from '@/components/ui/button';
import { clearStoredAuthTokens, isAuthEnabled, setStoredAccessToken, setStoredRefreshToken } from '@/lib/auth';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (!isAuthEnabled()) {
      navigate('/', { replace: true });
      return;
    }

    if (auth.error) {
      clearStoredAuthTokens();
      return;
    }

    if (auth.user?.access_token) {
      setStoredAccessToken(auth.user.access_token);
      if (auth.user.refresh_token) {
        setStoredRefreshToken(auth.user.refresh_token);
      }
      navigate('/', { replace: true });
    }
  }, [auth.error, auth.user, navigate]);

  if (auth.error) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center p-8">
        <div className="w-full space-y-4 rounded-md border p-6">
          <h1 className="text-xl font-semibold">ログインに失敗しました</h1>
          <p className="text-sm text-muted-foreground">再度ログインしてください。</p>
          <Button type="button" className="w-full" onClick={() => navigate('/auth/login')}>
            ログイン画面へ
          </Button>
        </div>
      </div>
    );
  }

  return <div className="p-8">ログイン処理中...</div>;
};
