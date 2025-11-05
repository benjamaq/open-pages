export default function ResultsPatterns() {
  return (
    <section className="bg-gray-50 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-2">Stop Guessing. Start Knowing.</h2>
        <p className="text-base md:text-lg text-center text-gray-600 mb-8">Real patterns BioStackr found:</p>

        <div className="flex flex-col gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-600 hover:shadow-lg transition-all">
            <div className="mb-2">
              <h3 className="text-xl font-bold text-gray-900 leading-tight">Phone Got Kicked Out</h3>
              <span className="text-sm text-gray-500">📱 Phone in Bedroom</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-semibold text-sm md:text-base mb-2">
              <span className="text-emerald-600">Without phone: Asleep by 10:30pm</span>
              <span className="text-gray-400">→</span>
              <span className="text-red-500">With phone: Asleep 12:15am+</span>
            </div>
            <p className="text-sm text-gray-700 italic mb-2">"As soon as I took my phone out of the bedroom, I went to bed to sleep. When I brought it, I went to bed and got on my phone. Different intention, different result."</p>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">High confidence</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-600 hover:shadow-lg transition-all">
            <div className="mb-2">
              <h3 className="text-xl font-bold text-gray-900 leading-tight">Fight With Girlfriend</h3>
              <span className="text-sm text-gray-500">💔 Heavy Discussions at Night</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-semibold text-sm md:text-base mb-2">
              <span className="text-red-500">Evening discussions: Sleep 4/10</span>
              <span className="text-gray-400">→</span>
              <span className="text-emerald-600">Daytime only: Sleep 7/10</span>
            </div>
            <p className="text-sm text-gray-700 italic mb-2">"Tension talks before bed were really difficult. We agreed: no serious talks in the evenings. During the day only. Sleep improved immediately."</p>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">High confidence</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-600 hover:shadow-lg transition-all">
            <div className="mb-2">
              <h3 className="text-xl font-bold text-gray-900 leading-tight">Eating After 9pm</h3>
              <span className="text-sm text-gray-500">🍽️ Light Meals Late</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-semibold text-sm md:text-base mb-2">
              <span className="text-emerald-600">Dinner by 7pm: Sleep 7/10</span>
              <span className="text-gray-400">→</span>
              <span className="text-red-500">Light meal 8:30pm: Sleep 5/10</span>
            </div>
            <p className="text-sm text-gray-700 italic mb-2">"Even 'light' food late meant restless sleep. Same calories, different timing, huge difference."</p>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">Moderate confidence</span>
          </div>

          <div className="bg-amber-50 border border-amber-400 rounded-xl p-6">
            <div className="mb-2">
              <h3 className="text-xl font-bold text-amber-800 leading-tight">Magnesium Surprise</h3>
              <span className="text-sm text-amber-700">💊 Magnesium Daily</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-semibold text-sm md:text-base mb-2">
              <span className="text-emerald-600">Without: Anxiety 4/10</span>
              <span className="text-amber-700">→</span>
              <span className="text-red-600 font-bold">With: Anxiety 7/10 WORSE</span>
            </div>
            <p className="text-sm text-amber-900 italic mb-2">"Everyone said it would help anxiety. For me, it was making things worse. Stopped it, anxiety dropped within a week."</p>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">High confidence</span>
          </div>
        </div>

        <p className="text-center text-base md:text-lg text-gray-700 leading-relaxed mb-3">
          These patterns were hiding in plain sight.<br />BioStackr made them visible.
        </p>
        <a href="#sample-report" className="block text-center text-purple-700 underline mb-4">See a sample report →</a>
        <a href="/auth/signup" className="block w-fit mx-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl">Find Your Patterns – Free</a>
      </div>
    </section>
  )
}

