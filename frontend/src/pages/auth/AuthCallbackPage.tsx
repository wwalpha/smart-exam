import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { clearStoredAccessToken, isAuthEnabled, persistTokenFromCallbackHash } from '@/lib/auth';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [isError, setIsError] = useState(false);

  const loginUrl = useMemo(() => '/auth/login', []);

  useEffect(() => {
    if (!isAuthEnabled()) {
      navigate('/', { replace: true });
      return;
    }

    const ok = persistTokenFromCallbackHash(window.location.hash);
    if (!ok) {
      clearStoredAccessToken();
      setIsError(true);
      return;
    }

    navigate('/', { replace: true });
  }, [navigate]);

  if (isError) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center p-8">
        <div className="w-full space-y-4 rounded-md border p-6">
          <h1 className="text-xl font-semibold">ログインに失敗しました</h1>
          <p className="text-sm text-muted-foreground">再度ログインしてください。</p>
          <Button type="button" className="w-full" onClick={() => navigate(loginUrl)}>
            ログイン画面へ
          </Button>
        </div>
      </div>
    );
  }

  return <div className="p-8">ログイン処理中...</div>;
};
