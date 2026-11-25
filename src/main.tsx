import React from 'react';
import ReactDOM from 'react-dom/client';
import { initGlobalErrorReporter } from '@yggdrasil-lab/ui';
import '@yggdrasil-lab/ui/style.css';
import './index.css';
import { App } from './App';

initGlobalErrorReporter();

function registerPushServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  if (!import.meta.env.PROD) {
    return;
  }
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Push SW registration failure should not block cockpit rendering
    });
  });
}

registerPushServiceWorker();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root mount element #root not found');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
