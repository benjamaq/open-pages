'use client';

import React, { useEffect, useRef, useState } from 'react';

type SafeTypeProps = {
  text: string;
  speed?: number;
  className?: string;
};

class ErrorBoundary extends React.Component<React.PropsWithChildren<{ fallback: React.ReactNode }>, { hasError: boolean }> {
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
  // DIAGNOSTIC: confirm new rAF SafeType is active
  try { console.log('🔴 NEW SafeType loaded - speed:', speed, 'text length:', safe.length); } catch {}
  const [displayText, setDisplayText] = useState<string>('');
  const rafRef = useRef<number | null>(null);
  const indexRef = useRef<number>(0);

  useEffect(() => {
    // Reset state and cancel any existing animation
    setDisplayText('');
    indexRef.current = 0;
    if (rafRef.current) {
      try { cancelAnimationFrame(rafRef.current); } catch {}
      rafRef.current = null;
    }

    const ms = typeof speed === 'number' && speed > 0 ? speed : 15;
    const now = (typeof performance !== 'undefined' && performance.now) ? () => performance.now() : () => Date.now();
    let lastTime = now();

    const typeChar = (currentTime: number) => {
      const elapsed = currentTime - lastTime;
      if (elapsed >= ms) {
        if (indexRef.current < safe.length) {
          indexRef.current += 1;
          setDisplayText(safe.substring(0, indexRef.current));
          lastTime = currentTime;
        } else {
          rafRef.current = null;
          return; // done
        }
      }
      rafRef.current = requestAnimationFrame(typeChar);
    };

    // Start animation (guard for environments without rAF)
    try {
      rafRef.current = requestAnimationFrame(typeChar);
    } catch {
      // Fallback: render instantly
      setDisplayText(safe);
    }

    return () => {
      if (rafRef.current) {
        try { cancelAnimationFrame(rafRef.current); } catch {}
        rafRef.current = null;
      }
    };
  }, [safe, speed]);

  const fallback = <div className={className}>{safe}</div>;

  return (
    <ErrorBoundary fallback={fallback}>
      <div className={className}>{displayText}</div>
    </ErrorBoundary>
  );
}


