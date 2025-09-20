'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Star } from 'lucide-react'

interface ShopGearItem {
  id: string
  name: string
  description?: string
  brand?: string
  category?: string
  price?: string
  affiliate_url: string
  image_url?: string
  commission_rate?: string
  featured: boolean
  sort_order: number
  public: boolean
}

interface PublicShopMyGearSectionProps {
  items: ShopGearItem[]
  isOwner: boolean
}

export default function PublicShopMyGearSection({ items, isOwner }: PublicShopMyGearSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Filter to only show public items
  const publicItems = items.filter(item => item.public)
  
  // Sort by featured first, then by sort_order
  const sortedItems = publicItems.sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return a.sort_order - b.sort_order
  })

  if (sortedItems.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🛍️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Shop My Gear</h3>
            <p className="text-sm text-gray-600">
              {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} • 
              <span className="text-xs text-purple-600 ml-1">
                Some links may earn a commission
              </span>
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-4">
          {/* Affiliate Disclosure */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Affiliate Disclosure:</strong> Some links above are affiliate links, which means I may earn a small commission if you make a purchase through them. This doesn't affect the price you pay and helps support the content I create.
            </p>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedItems.map((item) => (
              <ShopGearCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ShopGearCard({ item }: { item: ShopGearItem }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      {/* Image */}
      {item.image_url && !imageError && (
        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* Featured Badge */}
      {item.featured && (
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-xs font-medium text-yellow-700">Featured</span>
        </div>
      )}

      {/* Product Info */}
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
          {item.name}
        </h4>
        
        {item.brand && (
          <p className="text-xs text-gray-500 mb-1">{item.brand}</p>
        )}
        
        {item.price && (
          <p className="text-sm font-semibold text-green-600 mb-2">{item.price}</p>
        )}
        
        {item.description && (
          <p className="text-xs text-gray-600 line-clamp-3">{item.description}</p>
        )}
      </div>

      {/* Action Button */}
      <a
        href={item.affiliate_url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span>Shop Now</span>
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  )
}
