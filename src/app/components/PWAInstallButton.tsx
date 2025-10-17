'use client';

import { usePWAInstall } from './usePWAInstall';

export default function PWAInstallButton() {
  const { canInstall, installed, promptInstall } = usePWAInstall();

  // Always render on iOS to show fallback instructions
  const isiOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (installed) return null;
  if (!canInstall && !isiOS) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => void promptInstall()}
        className="bg-gray-900 text-white px-2 py-1 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap flex-shrink-0"
      >
        Install app
      </button>
      {isiOS && (
        <span className="text-[11px] sm:text-xs text-gray-500 whitespace-nowrap">
          iOS: Share → Add to Home Screen
        </span>
      )}
    </div>
  );
}


