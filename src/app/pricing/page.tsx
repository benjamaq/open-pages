"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-neutral-900 font-semibold">BioStackr</Link>
          <Link href="/contact" className="text-sm text-neutral-600 hover:text-neutral-900">Contact</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900">Pricing</h1>
          <p className="mt-2 text-neutral-600">Same calm, clear approach — now with options.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Starter</h2>
            <p className="text-sm text-neutral-600 mb-6">$0/month</p>
            <div className="text-5xl font-bold text-neutral-900 mb-6">$0<span className="text-base font-normal text-neutral-600">/month</span></div>
            <ul className="space-y-3 text-neutral-700 mb-8">
              <li>Track up to 3 supplements</li>
              <li>Manual check-ins</li>
              <li>Basic pattern insights</li>
            </ul>
            <Link href="/checkout?plan=free">
              <Button className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-full py-6 font-semibold">
                Start Casual →
              </Button>
            </Link>
          </div>
          <div className="bg-white rounded-2xl border-2 border-black shadow-lg p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-block rounded-full bg-black text-white px-4 py-1 text-xs font-semibold">POPULAR</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Premium</h2>
            <p className="text-sm text-neutral-600 mb-1">$19/month</p>
            <div className="text-5xl font-bold text-neutral-900 mb-1">$19<span className="text-base font-normal text-neutral-600">/month</span></div>
            <div className="text-sm text-neutral-700 mb-6">or <span className="font-semibold">$149/year</span> <span className="text-neutral-500">• $12.42/mo • Billed annually</span></div>
            <ul className="space-y-3 text-neutral-700 mb-8">
              <li>Unlimited supplements</li>
              <li>Wearable data analysis</li>
              <li>Cohen&apos;s d effect sizing</li>
              <li>Full Breakup Reports</li>
            </ul>
            <Link href="/checkout?plan=pro">
              <Button className="w-full bg-black hover:bg-neutral-800 text-white rounded-full py-6 font-semibold">
                Get Answers →
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

