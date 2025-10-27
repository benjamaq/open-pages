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
      // Explicitly log the raw prop value
      console.log('🚀 SafeType SPEED PARAMETER:', speed);
      console.log('🚀 SafeType START - Speed:', ms, 'ms');

      let currentIndex = 0;
      intervalRef.current = setInterval(() => {
        try {
          if (currentIndex < safe.length) {
            setDisplayText(safe.substring(0, currentIndex + 1));
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            // Explicitly log the prop speed in every tick
            console.log('⏱️ Using speed:', speed, 'ms per character');
            console.log('⏱️ Character typed - Delay used:', ms, 'ms');
            currentIndex++;
          } else {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            const done = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            console.log('✅ SafeType COMPLETE - Total time:', Math.round(done - t0), 'ms');
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


