'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  amount: number
  currency: string
  planType: 'creator'
  billingPeriod: 'monthly' | 'yearly'
  customerEmail: string
  customerName: string
  onSuccess: () => void
  onError: (error: string) => void
}

function PaymentForm({ 
  amount, 
  currency, 
  planType, 
  billingPeriod, 
  customerEmail, 
  customerName,
  onSuccess, 
  onError 
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [billingDetails, setBillingDetails] = useState({
    name: customerName,
    email: customerEmail,
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      // Get card elements
      const cardNumber = elements.getElement(CardNumberElement)
      if (!cardNumber) {
        throw new Error('Card number element not found')
      }

      // Create payment method with billing details
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
        billing_details: billingDetails,
      })

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message)
      }

      // Create subscription via our API
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
          plan_type: planType,
          billing_period: billingPeriod,
          customer_email: customerEmail,
          customer_name: customerName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed')
      }

      // Handle successful payment
      onSuccess()
    } catch (err) {
      console.error('Payment error:', err)
      onError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const elementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
        lineHeight: '24px',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
      complete: {
        color: '#059669',
        iconColor: '#059669',
      },
    },
  }

  const handleBillingChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setBillingDetails(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setBillingDetails(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cardholder Name */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          value={billingDetails.name}
          onChange={(e) => handleBillingChange('name', e.target.value)}
          className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
          placeholder="Full name on card"
          required
        />
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Card Number
        </label>
        <div className="w-full h-12 px-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 flex items-center">
          <CardNumberElement options={elementOptions} />
        </div>
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Expiry Date
          </label>
          <div className="w-full h-12 px-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 flex items-center">
            <CardExpiryElement options={elementOptions} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            CVC
          </label>
          <div className="w-full h-12 px-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 flex items-center">
            <CardCvcElement options={elementOptions} />
          </div>
        </div>
      </div>

      {/* Billing Address */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Billing Address</h3>
        
        <div>
          <input
            type="text"
            value={billingDetails.address.line1}
            onChange={(e) => handleBillingChange('address.line1', e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            placeholder="Address line 1"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={billingDetails.address.city}
            onChange={(e) => handleBillingChange('address.city', e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            placeholder="City"
            required
          />
          <input
            type="text"
            value={billingDetails.address.state}
            onChange={(e) => handleBillingChange('address.state', e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            placeholder="State"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={billingDetails.address.postal_code}
            onChange={(e) => handleBillingChange('address.postal_code', e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            placeholder="ZIP Code"
            required
          />
          <select
            value={billingDetails.address.country}
            onChange={(e) => handleBillingChange('address.country', e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="ES">Spain</option>
            <option value="IT">Italy</option>
            <option value="NL">Netherlands</option>
            <option value="SE">Sweden</option>
            <option value="NO">Norway</option>
            <option value="DK">Denmark</option>
            <option value="FI">Finland</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-purple-800 hover:bg-purple-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors mt-6"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Processing Payment...</span>
          </div>
        ) : (
          `Complete Setup - $${(amount / 100).toFixed(2)}`
        )}
      </button>

      {/* Security Notice */}
      <div className="text-center space-y-2 mt-4">
        <p className="text-xs text-gray-600">
          🔒 Your payment information is secure and encrypted
        </p>
      </div>
    </form>
  )
}

interface StripePaymentFormProps {
  amount: number
  currency: string
  planType: 'creator'
  billingPeriod: 'monthly' | 'yearly'
  customerEmail: string
  customerName: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}