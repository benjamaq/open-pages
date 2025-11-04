import React from 'react'

interface BrandSparkIconProps {
  size?: number;
  className?: string;
}

/**
 * BrandSparkIcon
 * Reusable brand spark icon to replace legacy heart emoji.
 */
export default function BrandSparkIcon({ size = 48, className }: BrandSparkIconProps) {
  const s = String(size)
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      focusable={false}
    >
      {/* Radiating lines (teal) */}
      <line x1="24" y1="8" x2="24" y2="15" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="24" y1="33" x2="24" y2="40" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="8" y1="24" x2="15" y2="24" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="33" y1="24" x2="40" y2="24" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="13" y1="13" x2="18" y2="18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="30" y1="30" x2="35" y2="35" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="35" y1="13" x2="30" y2="18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="18" y1="30" x2="13" y2="35" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Center diamond (gold) */}
      <path d="M24 18L28 24L24 30L20 24Z" fill="#F4B860"/>
    </svg>
  )
}


