import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
try {
  registerSW({ immediate: true });
} catch (e) {
  console.warn('PWA service worker not available in development.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
