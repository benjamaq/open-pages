'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

interface BetaCodeInputProps {
  onSuccess: (code: string) => void
  onError: (message: string) => void
}

export default function BetaCodeInput({ onSuccess, onError }: BetaCodeInputProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsLoading(true)
    setIsValid(null)

    try {
      const response = await fetch('/api/beta/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      })

      const result = await response.json()

          if (response.ok) {
            setIsValid(true)
            console.log('✅ Beta code validated, calling onSuccess with:', code.trim())
            onSuccess(code.trim())
          } else {
        setIsValid(false)
        onError(result.error || 'Invalid beta code')
      }
    } catch (error) {
      setIsValid(false)
      onError('Failed to validate beta code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Have a Beta Code?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter your beta code to get 6 months of Pro access for free!
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Beta Code"
            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isValid === true 
                ? 'border-green-300 bg-green-50' 
                : isValid === false 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !code.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              'Validating...'
            ) : isValid === true ? (
              <>
                <Check className="w-4 h-4" />
                Valid!
              </>
            ) : isValid === false ? (
              <>
                <X className="w-4 h-4" />
                Invalid
              </>
            ) : (
              'Validate'
            )}
          </button>
        </div>
      </div>

      {isValid === true && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-1">
                ✅ Beta Code Validated!
              </h4>
              <p className="text-sm text-green-700 mb-2">
                Your beta code is valid. Complete the form below to create your account and get 6 months of Pro access for free!
              </p>
              <p className="text-xs text-green-600">
                💡 Fill in your details below and click "Create your account"
              </p>
            </div>
          </div>
        </div>
      )}

      {isValid === false && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ❌ Invalid or expired beta code. Please check and try again.
          </p>
        </div>
      )}
    </div>
  )
}
