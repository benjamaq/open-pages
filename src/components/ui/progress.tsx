'use client';

import * as React from 'react';

type ProgressProps = {
  value?: number;
  className?: string;
};

export function Progress({ value = 0, className = '' }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-3 w-full rounded-full overflow-hidden ${className}`}
      style={{ backgroundColor: '#E8E5E0' }} // track
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${clamped}%`, backgroundColor: '#C65A2E' }} // burnt clay fill
      />
    </div>
  );
}


