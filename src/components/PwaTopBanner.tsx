"use client";
import { useEffect, useState } from "react";

export default function PwaTopBanner() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    try {
      const ua = navigator.userAgent || "";
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const isAndroid = /Android/i.test(ua);
      const isMobile = isIOS || isAndroid;
      const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
      const dismissed = typeof window !== 'undefined' && localStorage.getItem('pwa_banner_dismissed') === '1';
      if (isMobile && !isStandalone && !dismissed) {
        if (isIOS) setPlatform('ios');
        else if (isAndroid) setPlatform('android');
        else setPlatform('other');
        setShow(true);
      }
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Install BioStackr"
      className="sticky top-0 z-50 w-full"
      style={{ background: '#4f46e5', color: 'white' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="flex items-start gap-3">
          <div className="flex-1 text-sm leading-snug">
            <div className="font-semibold">Install BioStackr on home screen</div>
            <div className="opacity-90">
              {platform === 'ios' ? (
                <span className="inline-flex items-center gap-2">
                  <span>Tap</span>
                  {/* iOS share icon (inline SVG) */}
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline" style={{ verticalAlign: 'middle' }}>
                    <path d="M12 3v10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 7l4-4 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 12v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>then "Add to Home Screen"</span>
                </span>
              ) : (
                <span>Android: Menu ⋮ → Add to Home screen</span>
              )}
            </div>
          </div>
          <button
            aria-label="Dismiss"
            onClick={() => { try { localStorage.setItem('pwa_banner_dismissed','1'); } catch {}; setShow(false); }}
            className="text-white/90 hover:text-white"
            style={{ background: 'transparent', border: 'none', fontSize: '18px', lineHeight: '1', padding: 0 }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}


