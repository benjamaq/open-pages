"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function CheckoutPage() {
  const params = useSearchParams()
  const plan = params.get("plan") || "pro"
  const price = plan === "free" ? 0 : 12

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-neutral-900 font-semibold">BioStackr</Link>
          <Link href="/pricing" className="text-sm text-neutral-600 hover:text-neutral-900">Pricing</Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-3xl font-semibold text-neutral-900 text-center">Checkout</h1>
        <p className="mt-2 text-center text-neutral-600">Plan: <span className="font-medium">{plan}</span> — {price === 0 ? "€0/month" : `€${price}/month`}</p>
        <div className="mt-8 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <p className="text-neutral-700 mb-6">This is a placeholder checkout. Connect Stripe to enable payments.</p>
          <div className="space-y-4">
            <input className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900" placeholder="Card number" />
            <div className="grid grid-cols-2 gap-3">
              <input className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900" placeholder="MM / YY" />
              <input className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900" placeholder="CVC" />
            </div>
            <input className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900" placeholder="Name on card" />
          </div>
          <Button className="mt-6 w-full bg-black text-white hover:bg-neutral-800 rounded-full py-6 font-semibold">
            {price === 0 ? "Activate Free Plan" : "Start Subscription"}
          </Button>
          <p className="mt-3 text-xs text-neutral-500 text-center">No charges will be made in this demo.</p>
        </div>
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900 underline">Back to home</Link>
        </div>
      </main>
    </div>
  )
}

