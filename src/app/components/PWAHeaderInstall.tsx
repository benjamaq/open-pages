'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePWAInstall } from './usePWAInstall';

export default function PWAHeaderInstall() {
  const { canInstall, installed, promptInstall } = usePWAInstall();
  const isiOS = useMemo(() => (typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)), []);
  // Hide on desktop and on public link pages (/u/, /biostackr/, /share/)
  const isDesktop = useMemo(() => (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width: 768px)').matches), []);
  const isPublicLink = useMemo(() => (typeof window !== 'undefined' && /\/(u|biostackr|share)\//.test(window.location.pathname)), []);
  const [dismissed, setDismissed] = useState(false);
  const isiOSChrome = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && /crios/.test(ua);
  }, []);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('pwa_banner_dismissed') : null;
      if (stored === '1') setDismissed(true);
    } catch {}
  }, []);

  const onDismiss = () => {
    setDismissed(true);
    try { window.localStorage.setItem('pwa_banner_dismissed', '1'); } catch {}
  };

  if (installed || dismissed) return null;
  if (isDesktop || isPublicLink) return null;

  const show = isiOS || canInstall;
  if (!show) return null;

  const ShareIcon = () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="inline h-4 w-4 align-[-2px] mx-1">
      <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  return (
    <div className="w-full bg-violet-600 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
        <div className="flex-1 text-sm sm:text-base">
          <div className="font-semibold">Install App on Home Screen</div>
          {isiOS ? (
            <div className="opacity-90">
              {isiOSChrome ? (
                <>
                  Open this page in <span className="font-medium">Safari</span>, tap
                  <ShareIcon />
                  then scroll down and tap <span className="font-medium">Add to Home Screen</span>.
                </>
              ) : (
                <>
                  Tap
                  <ShareIcon />
                  then scroll down and tap <span className="font-medium">Add to Home Screen</span>.
                </>
              )}
            </div>
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
        {isiOSChrome && (
          <button
            onClick={() => {
              try {
                navigator.clipboard?.writeText?.(window.location.href);
              } catch {}
              alert('Link copied. Open Safari and paste to install.');
            }}
            className="bg-white/10 border border-white/30 text-white font-semibold text-sm px-3 py-1.5 rounded-md hover:bg-white/20"
          >
            Copy link for Safari
          </button>
        )}
        <button
          onClick={onDismiss}
          aria-label="Dismiss install banner"
          className="text-white/90 hover:text-white text-sm"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
