'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
};

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      const ev = e as BeforeInstallPromptEvent;
      ev.preventDefault();
      console.log('🟣 PWA: beforeinstallprompt captured');
      setDeferred(ev);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
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

  if (!visible) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[9999]">
      <div className="flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border border-gray-200 bg-white text-gray-900">
        <span className="text-sm">Install Open Pages?</span>
        <button onClick={onInstall} className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-md">Install</button>
        <button onClick={() => setVisible(false)} className="text-sm px-3 py-1.5 bg-gray-200 rounded-md">Dismiss</button>
      </div>
    </div>
  );
}


