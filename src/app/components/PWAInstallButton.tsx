'use client';

import { usePWAInstall } from './usePWAInstall';

export default function PWAInstallButton() {
  const { canInstall, installed, promptInstall } = usePWAInstall();

  if (installed || !canInstall) return null;

  return (
    <button
      onClick={() => void promptInstall()}
      className="bg-gray-900 text-white px-2 py-1 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap flex-shrink-0"
    >
      Install app
    </button>
  );
}


