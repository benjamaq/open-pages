// Buy button component for public profiles
// This will be added to existing item cards

import React from 'react';

interface BuyButtonProps {
  buyLink?: string | null;
  brand?: string | null;
  className?: string;
  size?: 'sm' | 'md';
  style?: 'outline' | 'solid';
}

export function BuyButton({ 
  buyLink,
  brand,
  className = "",
  size = 'sm',
  style = 'outline'
}: BuyButtonProps) {
  if (!buyLink || buyLink.trim() === '') {
    return null;
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base'
  };

  const styleClasses = {
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    solid: 'bg-gray-900 text-white hover:bg-gray-800'
  };

  return (
    <a
      href={buyLink}
      target="_blank"
      rel="nofollow sponsored noopener"
      className={`
        inline-flex items-center gap-1 rounded-lg font-medium transition-colors
        ${sizeClasses[size]}
        ${styleClasses[style]}
        ${className}
      `}
    >
      {brand ? `→ Buy at ${brand}` : '→ Buy this item'}
    </a>
  );
}

// Alternative versions for testing different styles
export function BuyButtonBranded({ 
  buyLink, 
  retailer = "Shop",
  className = ""
}: { 
  buyLink?: string | null;
  retailer?: string;
  className?: string;
}) {
  if (!buyLink || buyLink.trim() === '') {
    return null;
  }

  return (
    <a
      href={buyLink}
      target="_blank"
      rel="nofollow sponsored noopener"
      className={`
        inline-flex items-center gap-1 px-3 py-1.5 
        border border-gray-300 rounded-lg text-sm text-gray-700 
        hover:bg-gray-50 transition-colors font-medium
        ${className}
      `}
    >
      Buy at {retailer} →
    </a>
  );
}

// Component for testing different button styles
export function BuyButtonShowcase({ buyLink }: { buyLink: string }) {
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900">Button Style Options:</h4>
      
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-20">Outline:</span>
          <BuyButton buyLink={buyLink} style="outline" />
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-20">Solid:</span>
          <BuyButton buyLink={buyLink} style="solid" />
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-20">Branded:</span>
          <BuyButtonBranded buyLink={buyLink} retailer="Amazon" />
        </div>
      </div>
    </div>
  );
}
