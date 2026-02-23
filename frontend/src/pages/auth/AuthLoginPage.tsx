import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { getStoredAccessToken, isAuthEnabled, setStoredAccessToken } from '@/lib/auth';

export const AuthLoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (!isAuthEnabled()) {
      navigate('/', { replace: true });
      return;
    }

    if (auth.user?.access_token) {
      setStoredAccessToken(auth.user.access_token);
      navigate('/', { replace: true });
      return;
    }

    if (getStoredAccessToken()) {
      navigate('/', { replace: true });
      return;
    }

    if (!auth.isLoading) {
      void auth.signinRedirect();
    }
  }, [auth.isLoading, auth.user, auth, navigate]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center p-8 text-sm text-muted-foreground">
      ログイン画面へ遷移中...
    </div>
  );
};
