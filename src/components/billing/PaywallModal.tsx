'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type BillingPeriod = 'monthly' | 'yearly'

export default function PaywallModal({
  open,
  onClose,
  defaultPeriod = 'yearly',
}: {
  open: boolean
  onClose: () => void
  defaultPeriod?: BillingPeriod
}) {
  const [period, setPeriod] = useState<BillingPeriod>(defaultPeriod)

  // We no longer initiate Stripe from this modal; always forward to /checkout

  const startCheckout = () => { window.location.href = '/checkout' }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[560px] rounded-xl bg-white p-6 sm:p-8 shadow-lg border border-gray-200">
        <h3 className="text-xl sm:text-2xl font-semibold text-center">Unlock your results</h3>
        <p className="mt-2 text-sm text-gray-600 text-center">See which supplements are actually working for you.</p>

        <div className="mt-5 space-y-3">
          <label className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="plan"
                className="h-4 w-4"
                checked={period === 'yearly'}
                onChange={() => setPeriod('yearly')}
              />
              <div>
                <div className="text-sm font-medium text-gray-900">$149/year</div>
                <div className="text-xs text-gray-600">$12.42/mo • Billed annually</div>
              </div>
            </div>
            <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Recommended</span>
          </label>
          <label className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="plan"
                className="h-4 w-4"
                checked={period === 'monthly'}
                onChange={() => setPeriod('monthly')}
              />
              <div>
                <div className="text-sm font-medium text-gray-900">$19/month</div>
                <div className="text-xs text-gray-600">Cancel anytime</div>
              </div>
            </div>
          </label>
        </div>

        <button
          onClick={startCheckout}
          className="mt-6 w-full h-12 rounded-full bg-[#111111] text-white text-sm font-semibold hover:bg-black"
        >
          Continue to checkout
        </button>
        <div className="mt-4 text-xs text-gray-600 text-center">
          Payments by Stripe. You can cancel anytime.
        </div>
      </div>
    </div>
  )
}


