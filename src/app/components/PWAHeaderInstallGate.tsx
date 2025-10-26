'use client';

import { useEffect, useState } from 'react';
import PWAHeaderInstall from './PWAHeaderInstall';

export default function PWAHeaderInstallGate() {
  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const isPublic = document?.body?.classList?.contains('public-link');
      setShouldShow(!isPublic);
    } catch {
      setShouldShow(true);
    }
  }, []);

  if (!mounted) return null;
  return shouldShow ? <PWAHeaderInstall /> : null;
}


