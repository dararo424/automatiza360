import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import { App } from './App';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  environment: (import.meta.env.VITE_APP_ENV as string) ?? 'development',
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function CrashFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 32,
        textAlign: 'center',
        background: '#f4f2ea',
        color: '#101b10',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Algo salió mal</h1>
      <p style={{ color: '#6f6e5e' }}>Ya registramos el error. Recarga la página para continuar.</p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#101b10',
          color: '#c9f24b',
          border: 'none',
          borderRadius: 12,
          padding: '10px 20px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Recargar →
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<CrashFallback />}>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
