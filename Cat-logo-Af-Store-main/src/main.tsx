import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com');

const isChunkLoadError = (message: string) =>
  /Failed to fetch dynamically imported module|Importing a module script failed/i.test(message);

if (typeof window !== 'undefined') {
  const reloadKey = 'chunk-recovery-reload';

  const recoverFromChunkError = (message: string) => {
    if (!isChunkLoadError(message)) return;

    const alreadyReloaded = sessionStorage.getItem(reloadKey) === '1';
    if (alreadyReloaded) return;

    sessionStorage.setItem(reloadKey, '1');
    window.location.reload();
  };

  window.addEventListener('error', (event) => {
    recoverFromChunkError(event.message || '');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || '');
    recoverFromChunkError(reason);
  });

  if (!isPreviewHost && !isInIframe && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silencia erro de registro para não impactar UX
      });
    });
  } else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 60 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  </StrictMode>,
);

