import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { buildManagedLoginUrl, getStoredAccessToken, isAuthEnabled } from '@/lib/auth';

export const AuthLoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthEnabled()) {
      navigate('/', { replace: true });
      return;
    }

    if (getStoredAccessToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center p-8">
      <div className="w-full space-y-4 rounded-md border p-6">
        <h1 className="text-xl font-semibold">ログイン</h1>
        <p className="text-sm text-muted-foreground">Cognito の認証画面でログインしてください。</p>
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            window.location.assign(buildManagedLoginUrl());
          }}>
          Cognitoでログイン
        </Button>
      </div>
    </div>
  );
};
