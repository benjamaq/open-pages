'use client';

import { useEffect, useMemo } from 'react';
import { usePWAInstall } from './usePWAInstall';

export default function PWAInstallFab() {
  const { canInstall, installed, promptInstall } = usePWAInstall();
  const isiOS = useMemo(() => (typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)), []);

  useEffect(() => {
    console.log('🟣 PWAInstallFab mount', { isiOS, canInstall, installed });
  }, [isiOS, canInstall, installed]);

  if (installed) return null;
  if (!canInstall && !isiOS) return null;

  return (
    <div className="fixed right-3 bottom-3 z-[9999] sm:hidden">
      <button
        onClick={() => void promptInstall()}
        className="px-3 py-2 rounded-full shadow-lg bg-gray-900 text-white text-xs font-medium"
      >
        Install app
      </button>
      {isiOS && (
        <div className="mt-1 text-[11px] text-gray-500 bg-white/90 backdrop-blur rounded-md px-2 py-1 border border-gray-200">
          iOS: Share → Add to Home Screen
        </div>
      )}
    </div>
  );
}


