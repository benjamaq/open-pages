'use client';

import React from 'react';
import { TypeAnimation } from 'react-type-animation';

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

export default function SafeType({ text, speed = 35, className }: SafeTypeProps) {
  const safe = typeof text === 'string' ? text : String(text ?? '');
  const fallback = <div className={className}>{safe}</div>;
  return (
    <ErrorBoundary fallback={fallback}>
      <TypeAnimation
        sequence={[safe]}
        speed={speed}
        wrapper="div"
        className={className}
        cursor={false}
      />
    </ErrorBoundary>
  );
}


