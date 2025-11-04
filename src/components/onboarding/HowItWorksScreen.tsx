'use client'

import { useState } from 'react'
import BrandSparkIcon from '@/components/BrandSparkIcon'

interface HowItWorksScreenProps {
  isOpen: boolean
  onContinue: () => void
}

export default function HowItWorksScreen({ isOpen, onContinue }: HowItWorksScreenProps) {
  const [showCustomTagsTip, setShowCustomTagsTip] = useState(false)
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="mb-2 flex justify-center"><BrandSparkIcon size={40} /></div>
            <h2 className="text-2xl font-bold text-gray-900">Here’s how this works</h2>
          </div>

          <div className="how-it-works-container space-y-8">
          {/* SECTION 1: Daily Check-in */}
          <div className="section-card bg-white p-6 rounded-lg border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">1</span>
              <h3 className="text-xl font-bold">Daily Check-In</h3>
            </div>
            <p className="text-gray-700 mb-4">Every day, you'll rate how you're feeling. Takes 20 seconds.</p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">→</span>
                <div>
                  <span className="font-semibold text-gray-900">Sleep quality</span>
                  <span className="text-sm text-gray-600 block">Move the slider from 1 (terrible) to 10 (perfect)</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">→</span>
                <div>
                  <span className="font-semibold text-gray-900">Mood</span>
                  <span className="text-sm text-gray-600 block">Move the slider from 1 (awful) to 10 (great)</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">→</span>
                <div>
                  <span className="font-semibold text-gray-900">Pain level</span>
                  <span className="text-sm text-gray-600 block">Move the slider from 1 (no pain) to 10 (severe pain)</span>
                </div>
              </li>
            </ul>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-md text-sm">
              <p className="text-gray-600">
                <span className="font-semibold">Why all three?</span> Sleep, mood, and pain affect each other. Tracking all three helps Elli spot connections faster.
              </p>
            </div>
          </div>

          {/* SECTION 2: Add Context */}
          <div className="section-card bg-white p-6 rounded-lg border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">2</span>
              <h3 className="text-xl font-bold">Add Context (Recommended)</h3>
            </div>
            <p className="text-gray-700 mb-4">
              <strong>This step is optional—but it helps us find patterns faster.</strong> After the sliders, you'll see buttons organized into categories. Click any that apply to today:
            </p>
            <div className="space-y-3 mb-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🌍</span>
                  <h4 className="font-semibold">Life Factors</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">Click buttons like:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">☕ Caffeine</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">😰 High stress</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">🏃 Exercise</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">🍕 Late meal</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">+ more</span>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🩺</span>
                  <h4 className="font-semibold">Symptoms</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">Click buttons like:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">🤕 Headache</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">😴 Fatigue</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">🧠 Brain fog</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">🤢 Nausea</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">+ more</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-3">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-blue-500">🏷️</span>
                Create Your Own Tags
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed mb-2">
                <strong>Don't see what you need? Make your own tag.</strong>
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                In each category, you'll see a "+ Custom" button. Click it to create 
                a tag for anything: "Argued with partner" • "Worked late" • "Horror movie" • 
                "Sunny day" • "New pillow" • "Ate dairy" • literally anything.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                When you tag the same things over time, Elli spots patterns: 
                "Your sleep drops to 4/10 on high-stress days vs 7/10 on calm days."
              </p>
            </div>
            <p className="text-sm text-gray-600 italic">
              Tag whatever you think might affect you. The more you tag, the faster 
              Elli finds what's really making a difference.
            </p>
          </div>

          {/* SECTION 3: Track Everything You're Trying */}
          <div className="section-card bg-white p-6 rounded-lg border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">3</span>
              <h3 className="text-xl font-bold">Track Everything You're Trying</h3>
            </div>
            <p className="text-gray-700 mb-4">After your first check-in, you can add everything you're trying — supplements, medications, routines, anything. The more you track, the faster we find what works.</p>
            <ul className="grid grid-cols-2 gap-2 mb-4">
              <li className="flex items-center gap-2 text-gray-700 text-sm"><span>💊</span> Supplements (magnesium, vitamin D, etc.)</li>
              <li className="flex items-center gap-2 text-gray-700 text-sm"><span>💉</span> Medications (prescriptions)</li>
              <li className="flex items-center gap-2 text-gray-700 text-sm"><span>📋</span> Protocols (morning routines, sleep hygiene)</li>
              <li className="flex items-center gap-2 text-gray-700 text-sm"><span>🏃</span> Exercise routines (yoga, walking, gym)</li>
              <li className="flex items-center gap-2 text-gray-700 text-sm"><span>🧘</span> Mindfulness practices (meditation, breathing)</li>
              <li className="flex items-center gap-2 text-gray-700 text-sm"><span>📊</span> Anything else you're testing</li>
            </ul>
            <p className="text-sm text-gray-600 italic">Elli tracks all of this and shows you what's actually helping—so 
              you can stop guessing and focus on what works.</p>
          </div>
          </div>

          {/* What to Expect */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What to expect</h3>
            <p className="text-gray-700 text-sm mb-3">After <strong>5–7 days</strong> of consistent tracking, I’ll start showing you patterns.</p>
            <ul className="list-disc pl-6 text-gray-800 text-sm space-y-1">
              <li>“Sleep quality averages 7/10 when you take magnesium 3+ days in a row”</li>
              <li>“Pain spikes to 8/10 within 48 hours of high‑stress days”</li>
              <li>“Mood drops to 4/10 on days after less than 6 hours sleep”</li>
            </ul>
            <p className="text-gray-700 text-sm mt-3">The more context you give me, the faster I can connect the dots.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition"
            >
              Ready to Start →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


