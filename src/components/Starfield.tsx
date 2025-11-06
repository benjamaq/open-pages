'use client'

import React, { useEffect, useState } from 'react'

type StarfieldProps = {
  count?: number
  className?: string
  opacity?: number
  color?: string
}

export default function Starfield({ count = 100, className = '', opacity = 0.6, color = '#ffffff' }: StarfieldProps) {
  const [stars, setStars] = useState<Array<{ top: number; left: number; size: number; opacity: number; key: string }>>([])

  useEffect(() => {
    // Generate stars client-side after mount to avoid SSR hydration mismatches
    const generated = Array.from({ length: count }).map((_, i) => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() < 0.8 ? 2 : Math.random() < 0.95 ? 3 : 4,
      opacity: Math.random() * 0.8 + 0.2,
      key: `star-${i}`
    }))
    setStars(generated)
  }, [count])

  return (
    <div className={`absolute inset-0 ${className}`} style={{ opacity }}>
      {stars.map((s) => (
        <div
          key={s.key}
          className="absolute rounded-full"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: `${s.size}px`, height: `${s.size}px`, opacity: s.opacity, backgroundColor: color }}
        />
      ))}
    </div>
  )
}


