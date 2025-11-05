export default function ResultsPatterns() {
  return (
    <section className="bg-gray-50 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-3">Stop Guessing. Start Knowing.</h2>
        <p className="text-lg md:text-xl text-center text-gray-600 mb-14">These are real patterns BioStackr found for real users:</p>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-purple-600 hover:shadow-xl transition-all">
            <div className="text-5xl mb-3">☕</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Caffeine After 2pm</h3>
            <div className="flex items-center justify-center gap-3 font-semibold text-lg mb-3">
              <span className="text-emerald-600">Sleep: 7/10</span>
              <span className="text-gray-500 text-2xl">→</span>
              <span className="text-red-500">4/10</span>
            </div>
            <p className="text-sm text-gray-700 italic">"Stopped afternoon coffee. Fell asleep 30 minutes faster within 3 days."</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-purple-600 hover:shadow-xl transition-all">
            <div className="text-5xl mb-3">🏃</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Evening Workouts</h3>
            <div className="flex items-center justify-center gap-3 font-semibold text-lg mb-3">
              <span className="text-emerald-600">Asleep by 10pm</span>
              <span className="text-gray-500 text-2xl">→</span>
              <span className="text-red-500">Awake until 1am</span>
            </div>
            <p className="text-sm text-gray-700 italic">"Moved workouts to morning. Problem solved immediately."</p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">💊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Magnesium (Surprise!)</h3>
            <div className="flex items-center justify-center gap-3 font-semibold text-lg mb-3">
              <span className="text-emerald-600">Anxiety: 4/10</span>
              <span className="text-gray-500 text-2xl">→</span>
              <span className="text-red-500 font-bold">6/10 WORSE</span>
            </div>
            <p className="text-sm text-gray-700 italic">"Everyone said it helps. For me, it was making things worse."</p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-purple-600 hover:shadow-xl transition-all">
            <div className="text-5xl mb-3">🍷</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Wine With Dinner</h3>
            <div className="flex items-center justify-center gap-3 font-semibold text-lg mb-3">
              <span className="text-emerald-600">Sleep: 7/10</span>
              <span className="text-gray-500 text-2xl">→</span>
              <span className="text-red-500">3/10</span>
            </div>
            <p className="text-sm text-gray-700 italic">"Thought one glass was fine. Data showed otherwise."</p>
          </div>
        </div>

        <p className="text-center text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
          <span className="font-semibold text-gray-900">These patterns were hiding in plain sight.</span><br />
          BioStackr made them visible.
        </p>

        <a href="/auth/signup" className="block w-fit mx-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl">Find Your Patterns – Free</a>
      </div>
    </section>
  )
}

