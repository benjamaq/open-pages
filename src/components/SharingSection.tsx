'use client'

import { useState } from 'react'
import { Share2, Copy, Download, Twitter, Link as LinkIcon, Smartphone, Monitor } from 'lucide-react'
import { ShareInputs, shareText, copyCaption, copyLink, shareImageFromNode } from '../lib/sharing'

interface SharingSectionProps {
  inputs: ShareInputs
  onMessage: (message: string) => void
}

export default function SharingSection({ inputs, onMessage }: SharingSectionProps) {
  const [isSharing, setIsSharing] = useState(false)

  const handleShareText = async () => {
    setIsSharing(true)
    try {
      const result = await shareText(inputs)
      if (result.ok) {
        if (result.method === 'web-share') {
          onMessage('✅ Opened share menu! Choose where to post.')
        } else {
          onMessage('✅ Opened Twitter! Post your check-in.')
        }
      }
    } catch (error) {
      onMessage('❌ Share failed. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyCaption = async () => {
    try {
      await copyCaption(inputs)
      onMessage('✅ Text copied! Paste it anywhere (Instagram, Facebook, etc.)')
    } catch (error) {
      onMessage('❌ Copy failed. Please try again.')
    }
  }

  const handleCopyLink = async () => {
    try {
      await copyLink(inputs.publicUrl)
      onMessage('✅ Profile link copied! Share this to show your full stack.')
    } catch (error) {
      onMessage('❌ Copy failed. Please try again.')
    }
  }

  const handleShareImage = async () => {
    try {
      // Find the preview card element
      const previewCard = document.getElementById('share-preview-card')
      if (!previewCard) {
        onMessage('❌ Preview card not found')
        return
      }

      const result = await shareImageFromNode(previewCard as HTMLElement)
      if (result.ok) {
        if (result.method === 'web-share-file') {
          onMessage('✅ Opened share menu! Choose where to post the image.')
        } else {
          onMessage('✅ Image downloaded! Post it anywhere (Instagram, Facebook, etc.)')
        }
      }
    } catch (error) {
      onMessage('❌ Image share failed. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Clear explanation */}
      <div className="text-center bg-blue-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-zinc-900 mb-2">Share your daily check-in</h4>
        <p className="text-sm text-zinc-600">
          Choose how you want to share your energy, mood, and today's routine with others.
        </p>
      </div>

      {/* Share Options with Clear Descriptions */}
      <div className="space-y-4">
        {/* Share Text - Primary Option */}
        <div className="border border-zinc-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-zinc-900" />
              <h5 className="font-semibold text-zinc-900">Share Text</h5>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Smartphone className="w-3 h-3" />
              <span>Mobile</span>
            </div>
          </div>
          <p className="text-sm text-zinc-600 mb-3">
            Opens your phone's share menu. Choose WhatsApp, Instagram, Twitter, etc.
          </p>
          <button
            onClick={handleShareText}
            disabled={isSharing}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {isSharing ? 'Opening...' : 'Share Text'}
          </button>
        </div>

        {/* Share Image */}
        <div className="border border-zinc-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              <h5 className="font-semibold text-zinc-900">Share Image</h5>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Smartphone className="w-3 h-3" />
              <span>Mobile</span>
            </div>
          </div>
          <p className="text-sm text-zinc-600 mb-3">
            Creates a beautiful square image. Perfect for Instagram, Facebook, etc.
          </p>
          <button
            onClick={handleShareImage}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Share Image
          </button>
        </div>

        {/* Copy Options */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-zinc-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Copy className="w-4 h-4 text-zinc-600" />
              <h5 className="font-semibold text-zinc-900 text-sm">Copy Text</h5>
            </div>
            <p className="text-xs text-zinc-600 mb-2">
              Copy the text to paste anywhere
            </p>
            <button
              onClick={handleCopyCaption}
              className="w-full flex items-center justify-center gap-1 rounded-lg bg-zinc-100 px-3 py-2 text-zinc-900 hover:bg-zinc-200 transition-colors text-sm"
            >
              <Copy className="w-3 h-3" />
              Copy Text
            </button>
          </div>

          <div className="border border-zinc-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4 text-zinc-600" />
              <h5 className="font-semibold text-zinc-900 text-sm">Copy Link</h5>
            </div>
            <p className="text-xs text-zinc-600 mb-2">
              Copy your profile link
            </p>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-1 rounded-lg bg-zinc-100 px-3 py-2 text-zinc-900 hover:bg-zinc-200 transition-colors text-sm"
            >
              <LinkIcon className="w-3 h-3" />
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6">
        <h5 className="text-sm font-medium text-zinc-900 mb-3">What you'll share:</h5>
        <div className="bg-zinc-50 rounded-lg p-4 text-sm">
          <div className="whitespace-pre-line text-zinc-700">
            {composeCaption(inputs)}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to compose caption (duplicated from sharing.ts for preview)
function composeCaption(inputs: ShareInputs): string {
  const vibe = inputs.vibe.toLowerCase()
  let caption = `I'm feeling ${vibe} — ${inputs.energy}/10`
  
  if (inputs.sleep != null || inputs.recovery != null) {
    caption += `\nSleep ${inputs.sleep ?? '—'} • Recovery ${inputs.recovery ?? '—'}`
  }
  
  if (inputs.todayChips && inputs.todayChips.length > 0) {
    caption += `\nToday: ${inputs.todayChips.slice(0, 3).join(' • ')}`
  }
  
  if (inputs.supplementsCount && inputs.supplementsCount > 0) {
    caption += `\nSupplements: ${inputs.supplementsCount}`
  }
  
  caption += `\nFollow my stack → ${inputs.publicUrl}`
  caption += `\n#biohacking`
  
  return caption
}
