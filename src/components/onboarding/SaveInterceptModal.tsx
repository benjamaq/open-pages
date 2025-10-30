'use client'

interface SaveInterceptModalProps {
  isOpen: boolean
  onAddContext: () => void
  onSkip: () => void
  displayName: string
}

export default function SaveInterceptModal({ isOpen, onAddContext, onSkip, displayName }: SaveInterceptModalProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">💙</span>
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">Quick question, {displayName} —</p>
            <p className="text-gray-700 mb-1">Anything noteworthy about today?</p>
            <p className="text-sm text-gray-600 mb-3">High stress? Extra coffee? Poor sleep?</p>
            <p className="text-sm font-medium text-gray-900">The more I know, the faster I can help.</p>
            <p className="text-xs text-gray-500 mt-1">(This takes 1 minute)</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onAddContext} className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition">Add Context</button>
          <button onClick={onSkip} className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition">No, Just Save →</button>
        </div>
      </div>
    </div>
  )
}


