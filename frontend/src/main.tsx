import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from 'react-oidc-context';
import '@/index.css';
import { App } from '@/App';
import { getOidcClientConfig, isAuthEnabled } from '@/lib/auth';

const authEnabled = isAuthEnabled();
const oidcConfig = getOidcClientConfig();

const handleSigninCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {authEnabled ? (
      <AuthProvider {...oidcConfig} onSigninCallback={handleSigninCallback}>
        {app}
      </AuthProvider>
    ) : (
      app
    )}
  </StrictMode>,
);
