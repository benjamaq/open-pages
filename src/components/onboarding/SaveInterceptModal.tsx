'use client'

interface SaveInterceptModalProps {
  isOpen: boolean
  onAddContext: () => void
  onAccept: () => void
  displayName: string
}

export default function SaveInterceptModal({ isOpen, onAddContext, onAccept, displayName }: SaveInterceptModalProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-6 max-w-md mx-auto">
          <p className="text-lg font-semibold text-gray-800 mb-2">
            {displayName}, I'm already looking for patterns in your health.
          </p>
          <p className="text-gray-700 mb-1">
            The more I know, the quicker I can find what helps you.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            A quick tag could be the clue I need.
          </p>

          <div className="text-xs text-gray-500 mb-2 text-left">Examples</div>
          <div className="flex flex-wrap justify-center gap-2 my-4">
            <span className="px-3 py-2 bg-gray-100 rounded-full text-sm">🍔 Fast Food</span>
            <span className="px-3 py-2 bg-gray-100 rounded-full text-sm">🔥 High Stress</span>
            <span className="px-3 py-2 bg-gray-100 rounded-full text-sm">🤕 Injury</span>
            <span className="px-3 py-2 bg-gray-100 rounded-full text-sm">✈️ Travel</span>
            <span className="px-3 py-2 bg-gray-100 rounded-full text-sm">💜 Ovulation</span>
            <span className="px-3 py-2 bg-gray-100 rounded-full text-sm">🥗 Ate Clean</span>
          </div>

          <div className="space-y-3">
            <button
              onClick={onAddContext}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700"
            >
              Add Context (Find Patterns)
            </button>
            <button
              onClick={onAccept}
              className="w-full border border-gray-300 py-3 rounded-lg"
            >
              No, Just Save Now →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


