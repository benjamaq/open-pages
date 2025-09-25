'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

interface BetaFeedbackWidgetProps {
  isBetaUser?: boolean
}

export default function BetaFeedbackWidget({ isBetaUser = false }: BetaFeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isBetaUser) return null

  const handleFeedback = () => {
    const subject = encodeURIComponent('Beta Feedback - BioStackr')
    const body = encodeURIComponent(`
Hi BioStackr team,

I'm a beta user and wanted to share some feedback:

What I love:
- 

What could be improved:
- 

Feature requests:
- 

Overall experience:
- 

Thanks!
    `)
    
    window.open(`mailto:ben09@mac.com?subject=${subject}&body=${body}`, '_blank')
  }

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Send Beta Feedback"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                🧪 Beta Feedback
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Help us improve BioStackr! Your feedback is incredibly valuable during our beta period.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleFeedback}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  📧 Send Email Feedback
                </button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                Beta access expires in 6 months
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
