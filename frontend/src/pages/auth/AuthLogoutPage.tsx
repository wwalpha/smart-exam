import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { buildManagedLogoutUrl, clearStoredAuthTokens, isAuthEnabled } from '@/lib/auth';

export const AuthLogoutPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (!isAuthEnabled()) {
      navigate('/', { replace: true });
      return;
    }

    let isCancelled = false;

    void (async () => {
      clearStoredAuthTokens();

      try {
        await auth.removeUser();
      } catch {
        // OIDC保存状態の削除に失敗しても、Cognito側のログアウトは継続する。
      }

      if (isCancelled) {
        return;
      }

      // Hosted UI のセッションも破棄しないと、次回アクセス時に自動で復帰し得る。
      window.location.replace(buildManagedLogoutUrl());
    })();

    return () => {
      isCancelled = true;
    };
  }, [auth, navigate]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center p-8 text-sm text-muted-foreground">
      ログアウト処理中...
    </div>
  );
};