export default function ResultsPatterns() {
  return (
    <section className="bg-[#FCFBFA] py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-2">Stop Guessing. Start Knowing.</h2>
        <p className="text-base md:text-lg text-center text-gray-600 mb-8">Real patterns BioStackr uncovered in the first two weeks.</p>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* 1) Phone Stayed Out of the Bedroom */}
          <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all h-full min-h-[300px] flex flex-col" title="Based on ~9 days of tracking">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📱</span>
              <h3 className="text-lg font-bold text-gray-900">Phone Stayed Out of the Bedroom</h3>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base mb-1">
              <span className="text-slate-700">With phone in bed: Sleep 5/10</span>
              <span className="text-slate-400">→</span>
              <span className="text-[#4E9B72] font-medium">Phone left outside: Sleep 7/10</span>
            </div>
            <div className="my-3 h-px bg-slate-200" />
            <p className="text-sm text-gray-700 italic leading-[1.4]">“I used to climb into bed and scroll. The screen, the blue light — it kept my brain wired.”</p>
            <p className="text-sm text-gray-700 italic leading-[1.4]">“When I started leaving my phone in another room, I realised the difference wasn’t just the light — it was the intention.”</p>
            <p className="text-sm text-gray-700 italic leading-[1.4]">“Going to bed actually became about sleep again.”</p>
            <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EAE5FF] text-[#5C40D2] border border-[#d9d1ff] mt-auto">High confidence</span>
          </div>

          {/* 2) Evening Arguments */}
          <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all h-full min-h-[300px] flex flex-col" title="Based on ~12 days of tracking">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💬</span>
              <h3 className="text-lg font-bold text-gray-900">Evening Arguments</h3>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base mb-1">
              <span className="text-[#D8695F] font-medium">Talks after 9pm: Sleep 4/10</span>
              <span className="text-slate-400">→</span>
              <span className="text-[#4E9B72] font-medium">Talks before 7pm: Sleep 7/10</span>
            </div>
            <div className="my-3 h-px bg-slate-200" />
            <p className="text-sm text-gray-700 italic leading-[1.4]">“We used to have big talks right before bed — stressful ones about bills, plans, all of it.”</p>
            <p className="text-sm text-gray-700 italic leading-[1.4]">“I moved those talks earlier. Evenings got quiet — my brain finally slowed down.”</p>
            <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EAE5FF] text-[#5C40D2] border border-[#d9d1ff] mt-auto">High confidence</span>
          </div>

          {/* 3) Meals Too Close to Bed */}
          <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all h-full min-h-[300px] flex flex-col" title="Based on ~10 days of tracking">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🍽️</span>
              <h3 className="text-lg font-bold text-gray-900">Meals Too Close to Bed</h3>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base mb-1">
              <span className="text-slate-700">Ate ≤1h before bed: Sleep 5/10</span>
              <span className="text-slate-400">→</span>
              <span className="text-[#4E9B72] font-medium">Ate ≥3h before bed: Sleep 7/10</span>
            </div>
            <div className="my-3 h-px bg-slate-200" />
            <p className="text-sm text-gray-700 italic leading-[1.4]">“I thought a light snack before bed was harmless — same calories, right?”</p>
            <p className="text-sm text-gray-700 italic leading-[1.4]">“Moving dinner earlier stopped the 3am wake‑ups. Tiny change, huge effect.”</p>
            <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FAF4E9] text-[#7a5a2e] border border-[#E9D6A8] mt-auto">Moderate confidence</span>
          </div>

          {/* 4) Magnesium (The Plot Twist) */}
          <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl p-6 h-full min-h-[300px] flex flex-col" title="Based on ~14 days of tracking">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💊</span>
              <h3 className="text-lg font-bold text-amber-800">Magnesium (The Plot Twist)</h3>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base mb-1">
              <span className="text-slate-700">Before magnesium: Anxiety 4/10</span>
              <span className="text-slate-400">→</span>
              <span className="text-[#D8695F] font-medium">While taking magnesium: Anxiety 7/10 ↑</span>
            </div>
            <div className="my-3 h-px bg-slate-200" />
            <p className="text-sm text-amber-900 italic leading-[1.4]">“Everyone says magnesium helps you relax — so I took it daily.”</p>
            <p className="text-sm text-amber-900 italic leading-[1.4]">“What I didn’t expect was the opposite: even moving it to the afternoon, my heart raced and I couldn’t switch off.”</p>
            <p className="text-sm text-amber-900 italic leading-[1.4]">“I stopped completely, and the anxiety vanished within a week.”</p>
            <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EAE5FF] text-[#5C40D2] border border-[#d9d1ff] mt-auto">High confidence</span>
          </div>
        </div>

        <p className="text-center text-base md:text-lg text-gray-700 leading-relaxed mb-5">
          These patterns were hiding in plain sight — BioStackr just made them visible.
        </p>
        <div className="flex items-center justify-center">
          <a href="/auth/signup" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl">Find Your Patterns – Free</a>
        </div>
      </div>
    </section>
  )
}

