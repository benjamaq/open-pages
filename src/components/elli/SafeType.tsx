'use client';

import React, { useEffect, useRef, useState } from 'react';

type SafeTypeProps = {
  text: string;
  speed?: number;
  className?: string;
};

class ErrorBoundary extends React.Component<{ fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { /* swallow animation errors */ }
  render() {
    if (this.state.hasError) return this.props.fallback as any;
    return this.props.children as any;
  }
}

export default function SafeType({ text, speed = 15, className }: SafeTypeProps) {
  const safe = typeof text === 'string' ? text : String(text ?? '');
  const [displayText, setDisplayText] = useState<string>('');
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayText('');

      const ms = typeof speed === 'number' && speed > 0 ? speed : 25;
      const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      console.log('[SafeType] start', { ms, length: safe.length, t0 });

      let currentIndex = 0;
      intervalRef.current = setInterval(() => {
        try {
          if (currentIndex < safe.length) {
            setDisplayText(safe.substring(0, currentIndex + 1));
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            console.log('[SafeType] tick', { i: currentIndex, t: now, dt: Math.round(now - t0) });
            currentIndex++;
          } else {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            const done = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            console.log('[SafeType] complete', { totalMs: Math.round(done - t0), chars: safe.length });
          }
        } catch {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, ms);

      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    } catch {
      setDisplayText(safe);
    }
  }, [safe, speed]);

  const fallback = <div className={className}>{safe}</div>;

  return (
    <ErrorBoundary fallback={fallback}>
      <div className={className}>{displayText}</div>
    </ErrorBoundary>
  );
}


