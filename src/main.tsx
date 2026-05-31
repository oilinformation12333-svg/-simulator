import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global resilience guard to prevent sandbox DOMExceptions on alert()
try {
  if (typeof window !== 'undefined') {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      try {
        if (originalAlert) {
          originalAlert(msg);
        } else {
          console.log("ALERT:", msg);
        }
      } catch (err) {
        console.warn("PWA Sandbox protected. Alert blocked, message was:", msg);
      }
    };
  }
} catch (e) {
  console.warn("Failed to override window.alert:", e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for PWA installation support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PWA ServiceWorker successfully registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA ServiceWorker registration failed:', err);
      });
  });
}
