"use client";
import { useEffect, useState } from "react";

export default function PwaTopBanner() {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("Add to your Home Screen for a faster, app-like experience.");

  useEffect(() => {
    try {
      const ua = navigator.userAgent || "";
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const isAndroid = /Android/i.test(ua);
      const isMobile = isIOS || isAndroid;
      const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
      const dismissed = typeof window !== 'undefined' && localStorage.getItem('pwa_banner_dismissed') === '1';
      if (isMobile && !isStandalone && !dismissed) {
        if (isIOS) setMsg("iPhone: Share ↑ → Add to Home Screen — faster, daily reminders");
        else if (isAndroid) setMsg("Android: Menu ⋮ → Add to Home screen — faster, daily reminders");
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
            <div className="opacity-90">{msg}</div>
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


