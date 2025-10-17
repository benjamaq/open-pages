'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  // Service Worker registration with extensive logging
  useEffect(() => {
    console.log('🔵 PWA: useEffect triggered');
    try {
      if (typeof document !== 'undefined') {
        console.log('🔵 PWA: document.readyState:', document.readyState);
        document.body?.setAttribute('data-pwa-client', 'true');
      }
      window.addEventListener('load', () => console.log('🔵 PWA: window load fired'));
      window.addEventListener('beforeinstallprompt', () => console.log('🟣 PWA: beforeinstallprompt fired'));
      if (navigator?.serviceWorker) {
        navigator.serviceWorker.addEventListener('controllerchange', () => console.log('🟠 PWA: controllerchange'));
        navigator.serviceWorker.getRegistration().then((reg) => console.log('🔵 PWA: existing registration:', reg));
      }
    } catch (err) {
      console.warn('⚠️ PWA: pre-checks threw', err);
    }
    console.log('🔵 PWA: window type:', typeof window);
    console.log('🔵 PWA: navigator exists:', typeof navigator !== 'undefined');
    console.log('🔵 PWA: serviceWorker in navigator:', 'serviceWorker' in navigator);

    if (typeof window === 'undefined') {
      console.log('⏭️  PWA: Server-side, skipping');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('❌ PWA: Service Workers not supported');
      return;
    }

    console.log('✅ PWA: Supported, attempting registration...');
    // Preflight: ensure sw.js is reachable
    try {
      fetch('/sw.js', { cache: 'no-store' })
        .then((res) => console.log('🔍 PWA: /sw.js status', res.status, res.headers.get('content-type')))
        .catch((e) => console.warn('⚠️ PWA: /sw.js fetch failed', e));
    } catch (e) {
      console.warn('⚠️ PWA: preflight fetch threw', e);
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅✅ PWA: Service Worker registered!', registration);
        console.log('✅ PWA: Scope:', registration.scope);
        console.log('✅ PWA: Active:', registration.active);
        console.log('✅ PWA: Installing:', registration.installing);
        console.log('✅ PWA: Waiting:', registration.waiting);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🟡 PWA: updatefound; installing worker:', newWorker);
          newWorker?.addEventListener('statechange', () => {
            console.log('🟡 PWA: installing state:', newWorker.state);
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🟡 PWA: new version installed and waiting');
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌❌ PWA: Registration FAILED:', error);
        console.error('❌ PWA: Error name:', (error as Error).name);
        console.error('❌ PWA: Error message:', (error as Error).message);
      });
  }, []);

  return null;
}


