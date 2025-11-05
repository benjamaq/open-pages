export default function ResultsPatterns() {
  return (
    <section className="bg-gray-50 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-2">Stop Guessing. Start Knowing.</h2>
        <p className="text-base md:text-lg text-center text-gray-600 mb-8">Real patterns BioStackr uncovered in the first two weeks.</p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 1) Phone Stayed Out of the Bedroom */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-600 hover:shadow-lg transition-all h-full" title="Based on ~9 days of tracking">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📱</span>
              <h3 className="text-lg font-bold text-gray-900">Phone Stayed Out of the Bedroom</h3>
            </div>
            <div className="flex items-center gap-2 font-semibold text-sm md:text-base mb-2">
              <span className="text-red-500">With phone in bed: Sleep 5/10</span>
              <span className="text-gray-400">→</span>
              <span className="text-emerald-600">Phone left outside: Sleep 7/10</span>
            </div>
            <p className="text-sm text-gray-700 italic">“I used to climb into bed and scroll. The screen, the blue light — it kept my brain wired.”</p>
            <p className="text-sm text-gray-700 italic">“When I started leaving my phone in another room, I realised the difference wasn’t just the light — it was the intention.”</p>
            <p className="text-sm text-gray-700 italic mb-2">“Going to bed actually became about sleep again.”</p>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">High confidence</span>
          </div>

          {/* 2) Evening Arguments */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-600 hover:shadow-lg transition-all h-full" title="Based on ~12 days of tracking">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💬</span>
              <h3 className="text-lg font-bold text-gray-900">Evening Arguments</h3>
            </div>
            <div className="flex items-center gap-2 font-semibold text-sm md:text-base mb-2">
              <span className="text-red-500">Talks after 9pm: Sleep 4/10</span>
              <span className="text-gray-400">→</span>
              <span className="text-emerald-600">Talks before 7pm: Sleep 7/10</span>
            </div>
            <p className="text-sm text-gray-700 italic mb-2">“Timing our tough talks fixed my nights.”</p>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">High confidence</span>
          </div>

          {/* 3) Meals Too Close to Bed */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-600 hover:shadow-lg transition-all h-full" title="Based on ~10 days of tracking">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🍽️</span>
              <h3 className="text-lg font-bold text-gray-900">Meals Too Close to Bed</h3>
            </div>
            <div className="flex items-center gap-2 font-semibold text-sm md:text-base mb-2">
              <span className="text-red-500">Ate ≤1h before bed: Sleep 5/10</span>
              <span className="text-gray-400">→</span>
              <span className="text-emerald-600">Ate ≥3h before bed: Sleep 7/10</span>
            </div>
            <p className="text-sm text-gray-700 italic mb-2">“Same food, earlier timing — no 3am wake‑ups.”</p>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">Moderate confidence</span>
          </div>

          {/* 4) Magnesium (The Plot Twist) */}
          <div className="bg-amber-50 border border-amber-400 rounded-xl p-6 h-full" title="Based on ~14 days of tracking">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💊</span>
              <h3 className="text-lg font-bold text-amber-800">Magnesium (The Plot Twist)</h3>
            </div>
            <div className="flex items-center gap-2 font-semibold text-sm md:text-base mb-2">
              <span className="text-emerald-700">Before magnesium: Anxiety 4/10</span>
              <span className="text-amber-700">→</span>
              <span className="text-red-700 font-semibold">While taking magnesium: Anxiety 7/10 ↑</span>
            </div>
            <p className="text-sm text-amber-900 italic">“Everyone says magnesium helps you relax — so I took it daily.”</p>
            <p className="text-sm text-amber-900 italic">“What I didn’t expect was the opposite: even moving it to the afternoon, my heart raced and I couldn’t switch off.”</p>
            <p className="text-sm text-amber-900 italic mb-2">“I stopped completely, and the anxiety vanished within a week.”</p>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">High confidence</span>
          </div>
        </div>

        <p className="text-center text-base md:text-lg text-gray-700 leading-relaxed mb-3">
          These patterns were hiding in plain sight — BioStackr just made them visible.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="#sample-report" className="text-purple-700 underline">See a Sample Report →</a>
          <a href="/auth/signup" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl">Find Your Patterns – Free</a>
        </div>
      </div>
    </section>
  )
}

