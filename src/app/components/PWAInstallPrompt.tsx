'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
};

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    try {
      // Only show on mobile and when not already installed
      const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone;
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isNarrow = window.innerWidth < 768;
      const canShow = (isMobileUA || isNarrow) && !isStandalone;
      setEligible(canShow);

      if (!canShow) {
        setVisible(false);
        setDeferred(null);
        return;
      }

      const onBeforeInstall = (e: Event) => {
        const ev = e as BeforeInstallPromptEvent;
        ev.preventDefault();
        console.log('🟣 PWA: beforeinstallprompt captured');
        setDeferred(ev);
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', onBeforeInstall);
      // iOS Safari does not fire beforeinstallprompt; show a helper banner
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isIOS) {
        setVisible(true);
      }
      return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    } catch {
      // If anything fails, do nothing (hidden by default)
    }
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    try {
      console.log('🟣 PWA: prompting install...');
      await deferred.prompt();
      const result = await deferred.userChoice;
      console.log('🟣 PWA: userChoice', result);
    } catch (e) {
      console.warn('⚠️ PWA: install prompt failed', e);
    } finally {
      setVisible(false);
      setDeferred(null);
    }
  };

  if (!visible || !eligible) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-4 z-[9999]">
      <div className="flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border border-gray-200 bg-white text-gray-900">
        <span className="text-sm">Install BioStackr?</span>
        {/* If deferred prompt exists (Android/Chrome), show Install; on iOS we show a hint */}
        {deferred ? (
          <button onClick={onInstall} className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-md">Install</button>
        ) : (
          <span className="text-xs text-gray-600">On iPhone: Share (↑) → Add to Home Screen</span>
        )}
        <button onClick={() => setVisible(false)} className="text-sm px-3 py-1.5 bg-gray-200 rounded-md">Dismiss</button>
      </div>
    </div>
  );
}


