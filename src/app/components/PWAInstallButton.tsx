'use client';

import { useEffect, useState } from 'react';
import { usePWAInstall } from './usePWAInstall';

export default function PWAInstallButton() {
  const { canInstall, installed, promptInstall } = usePWAInstall();
  const [showTip, setShowTip] = useState(false);

  // Always render on iOS to show fallback instructions
  const isiOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('🟣 PWAInstallButton render', { canInstall, installed, isiOS });
  }

  useEffect(() => {
    const onInstalled = () => {
      setShowTip(true);
      setTimeout(() => setShowTip(false), 8000);
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  if (installed) return null;
  if (!canInstall && !isiOS) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={async () => {
            const ok = await promptInstall();
            if (ok) {
              setShowTip(true);
              setTimeout(() => setShowTip(false), 8000);
            }
          }}
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

      {showTip && (
        <div className="fixed bottom-4 right-4 z-[10000] max-w-sm shadow-lg border border-gray-200 bg-white rounded-xl p-3 sm:p-4">
          <div className="text-sm text-gray-900 font-medium mb-1">Installed</div>
          <p className="text-xs text-gray-600">
            Find BioStackr in your Dock/Taskbar and Applications. To refresh the app window, use <span className="font-medium">Cmd+R</span> (macOS) or <span className="font-medium">Ctrl+R</span> (Windows), or choose
            <span className="font-medium"> View → Reload</span> from the menu.
          </p>
          <div className="mt-2 text-right">
            <button onClick={() => setShowTip(false)} className="text-xs text-gray-600 hover:text-gray-800">Dismiss</button>
          </div>
        </div>
      )}
    </>
  );
}


