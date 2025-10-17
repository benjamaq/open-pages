'use client';

import { useMemo, useState } from 'react';
import { usePWAInstall } from './usePWAInstall';

export default function PWAHeaderInstall() {
  const { canInstall, installed, promptInstall } = usePWAInstall();
  const isiOS = useMemo(() => (typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)), []);
  const [dismissed, setDismissed] = useState(false);

  if (installed || dismissed) return null;

  const show = isiOS || canInstall;
  if (!show) return null;

  return (
    <div className="w-full bg-violet-600 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
        <div className="flex-1 text-sm sm:text-base">
          <div className="font-semibold">Install App on Home Screen</div>
          {isiOS ? (
            <div className="opacity-90">Open the Share menu, then tap <span className="font-medium">Add to Home Screen</span>.</div>
          ) : (
            <div className="opacity-90">Add BioStackr to your home screen for a faster, app-like experience.</div>
          )}
        </div>
        {!isiOS && canInstall && (
          <button
            onClick={() => void promptInstall()}
            className="bg-white text-violet-700 font-semibold text-sm px-3 py-1.5 rounded-md hover:bg-gray-100"
          >
            Install
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss install banner"
          className="text-white/90 hover:text-white text-sm"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
