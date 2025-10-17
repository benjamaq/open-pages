'use client';

import { useEffect, useState, useCallback } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
};

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      const ev = e as BeforeInstallPromptEvent;
      ev.preventDefault();
      setDeferred(ev);
      setCanInstall(true);
      console.log('🟣 PWA: beforeinstallprompt captured (hook)');
    };
    const onAppInstalled = () => {
      console.log('🟢 PWA: appinstalled');
      setInstalled(true);
      setCanInstall(false);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    // heuristic: if already standalone, treat as installed
    if (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone)) {
      setInstalled(true);
      setCanInstall(false);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    try {
      await deferred.prompt();
      const result = await deferred.userChoice;
      console.log('🟣 PWA: userChoice (hook)', result);
      if (result?.outcome === 'accepted') {
        setInstalled(true);
        setCanInstall(false);
        setDeferred(null);
        return true;
      }
    } catch (e) {
      console.warn('⚠️ PWA: prompt failed (hook)', e);
    }
    return false;
  }, [deferred]);

  return { canInstall, installed, promptInstall };
}


