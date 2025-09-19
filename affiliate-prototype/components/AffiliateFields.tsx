// Affiliate form fields component - simplified version
// This will be integrated into existing forms later

import React from 'react';
import { validateAffiliateUrl } from '../utils/validation';

interface AffiliateFieldsProps {
  brand: string;
  setBrand: (brand: string) => void;
  buyLink: string;
  setBuyLink: (link: string) => void;
  isPro: boolean;
  error?: string;
  setError?: (error: string | null) => void;
}

export function AffiliateFields({ 
  brand,
  setBrand,
  buyLink, 
  setBuyLink, 
  isPro,
  error,
  setError
}: AffiliateFieldsProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBuyLink(value);
    
    // Clear previous errors and validate
    if (setError) {
      const validation = validateAffiliateUrl(value);
      setError(validation.isValid ? null : validation.error || null);
    }
  };

  if (!isPro) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">💰 Affiliate Links</span>
            <p className="text-xs text-gray-500 mt-1">
              Add buy links to earn commissions from your recommendations
            </p>
          </div>
          <a 
            href="/pricing" 
            className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">💰 Affiliate Info</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">PRO</span>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Brand Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Brand
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., Thorne, NOW Foods, Optimum Nutrition"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
          />
        </div>

        {/* Buy Link Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Affiliate Link
          </label>
          <input
            type="url"
            value={buyLink}
            onChange={handleChange}
            placeholder="https://amazon.com/dp/B08... (optional)"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          
          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span>⚠️</span>
              {error}
            </p>
          )}
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        Add brand and affiliate link to earn commissions when people buy this item
      </p>
    </div>
  );
}

// Preview component for testing
export function AffiliateFieldsPreview({ 
  brand, 
  buyLink 
}: { 
  brand: string;
  buyLink: string;
}) {
  if (!buyLink) return null;
  
  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-xs font-medium text-blue-800 mb-2">Preview:</p>
      <div className="bg-white p-3 rounded border">
        <h4 className="font-medium text-gray-900">Sample Supplement</h4>
        {brand && (
          <p className="text-sm text-gray-500">{brand}</p>
        )}
        <p className="text-sm text-gray-600">5g daily</p>
        <a
          href="#"
          className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          → Buy this item
        </a>
      </div>
    </div>
  );
}
