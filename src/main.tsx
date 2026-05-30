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

// Unregister any active service workers to prevent stale cache bugs (such as cached index.html pointing to missing chunks)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('Stale Service Worker unregistered successfully.');
      });
    }
  }).catch((err) => {
    console.warn('Failed to get service worker registrations:', err);
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then((names) => {
    for (const name of names) {
      caches.delete(name).then(() => {
        console.log('Stale cache deleted:', name);
      });
    }
  }).catch((err) => {
    console.warn('Failed to clear caches:', err);
  });
}
