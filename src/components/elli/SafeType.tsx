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

export default function SafeType({ text, speed = 25, className }: SafeTypeProps) {
  const safe = typeof text === 'string' ? text : String(text ?? '');
  const [displayText, setDisplayText] = useState<string>('');
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    // Manual, deterministic typing to control exact speed
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayText('');

      const ms = typeof speed === 'number' && speed > 0 ? speed : 25;
      console.log('🔍 TYPING SPEED:', ms, 'ms per character');

      let currentIndex = 0;
      intervalRef.current = setInterval(() => {
        try {
          // Debug per tick (kept lightweight; remove if too noisy)
          // console.log('⏱️ Character delay:', ms);
          if (currentIndex < safe.length) {
            setDisplayText(safe.substring(0, currentIndex + 1));
            currentIndex++;
          } else {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } catch {
          // Ensure we never crash the UI due to typing errors
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, ms);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } catch {
      // Fallback: show full text immediately
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


