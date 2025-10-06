'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '../lib/supabase/client'

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

interface ShopMyGearSectionProps {
  profileId: string
  userTier: 'free' | 'pro' | 'creator'
  isOwner: boolean
  initialItems?: ShopGearItem[]
}

export default function ShopMyGearSection({ profileId, userTier, isOwner, initialItems = [] }: ShopMyGearSectionProps) {
  const [items, setItems] = useState<ShopGearItem[]>(initialItems)
  const [collapsed, setCollapsed] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopGearItem | null>(null)

  const supabase = createClient()

  // Don't show for non-creator tiers or if user is not owner
  if (userTier !== 'creator' || !isOwner) {
    return null
  }

  const handleAddItem = async (itemData: Omit<ShopGearItem, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shop_gear_items')
        .insert({
          profile_id: profileId,
          ...itemData
        })
        .select()
        .single()

      if (error) throw error

      setItems([...items, data])
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding shop gear item:', error)
      alert('Failed to add item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateItem = async (id: string, updates: Partial<ShopGearItem>) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shop_gear_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setItems(items.map(item => item.id === id ? data : item))
      setEditingItem(null)
    } catch (error) {
      console.error('Error updating shop gear item:', error)
      alert('Failed to update item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('shop_gear_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting shop gear item:', error)
      alert('Failed to delete item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    await handleUpdateItem(id, { featured })
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
            <p className="text-sm text-gray-600">Monetize your gear recommendations</p>
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
          {/* Items List */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 break-words">{item.name}</h4>
                      {item.featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Featured
                        </span>
                      )}
                      {item.price && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {item.price}
                        </span>
                      )}
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    )}
                    
                    {item.brand && (
                      <p className="text-xs text-gray-500 mb-2 break-words">Brand: {item.brand}</p>
                    )}
                    
                    {item.commission_rate && (
                      <p className="text-xs text-purple-600 font-medium">
                        Commission: {item.commission_rate}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleFeatured(item.id, !item.featured)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.featured 
                          ? 'bg-yellow-100 text-yellow-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={item.featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      ⭐
                    </button>
                    
                    <a
                      href={item.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="View affiliate link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Edit item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛍️</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No gear items yet</h4>
              <p className="text-gray-600 mb-4">Start building your shop by adding gear items with affiliate links.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add your first item
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingItem) && (
        <ShopGearForm
          item={editingItem}
          onSave={editingItem ? (updates) => handleUpdateItem(editingItem.id, updates) : handleAddItem}
          onCancel={() => {
            setShowAddForm(false)
            setEditingItem(null)
          }}
          loading={loading}
        />
      )}
    </div>
  )
}

// Form component for adding/editing shop gear items
function ShopGearForm({ 
  item, 
  onSave, 
  onCancel, 
  loading 
}: { 
  item: ShopGearItem | null
  onSave: (data: any) => void
  onCancel: () => void
  loading: boolean
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    brand: item?.brand || '',
    category: item?.category || '',
    price: item?.price || '',
    affiliate_url: item?.affiliate_url || '',
    image_url: item?.image_url || '',
    commission_rate: item?.commission_rate || '',
    featured: item?.featured || false,
    public: item?.public ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {item ? 'Edit Gear Item' : 'Add Gear Item'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe the product and why you recommend it..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., $99.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Rate
                </label>
                <input
                  type="text"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 5% or $10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affiliate URL *
              </label>
              <input
                type="url"
                value={formData.affiliate_url}
                onChange={(e) => setFormData({ ...formData, affiliate_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://example.com/affiliate-link"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://example.com/product-image.jpg"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Featured item</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.public}
                  onChange={(e) => setFormData({ ...formData, public: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Public</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
