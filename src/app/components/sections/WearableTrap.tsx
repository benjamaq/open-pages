export default function WearableTrap() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          You're Throwing Money at the Wrong Problem
        </h2>
        <p className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto">
          Wearables are great at telling you the problem exists.
          <br />
          They're terrible at telling you what's causing it.
        </p>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">⌚</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Your $400 Wearable</h3>
            </div>
            <ul className="space-y-4 text-lg text-gray-600">
              <li className="flex items-start gap-3"><span className="text-red-500 mt-1">❌</span><span>Sleep Score: 68/100</span></li>
              <li className="flex items-start gap-3"><span className="text-red-500 mt-1">❌</span><span>REM Sleep: 1h 12m</span></li>
              <li className="flex items-start gap-3"><span className="text-red-500 mt-1">❌</span><span>Deep Sleep: 42 minutes</span></li>
              <li className="flex items-start gap-3"><span className="text-red-500 mt-1">❌</span><span>Heart Rate Variability: 47ms</span></li>
              <li className="flex items-start gap-3"><span className="text-red-500 mt-1">❌</span><span>Recovery Score: Low</span></li>
            </ul>
            <p className="mt-8 text-base italic text-gray-500 text-center">Great. Now what?</p>
          </div>
          <div className="bg-gradient-to-br from-teal-700 to-amber-600 p-8 rounded-2xl border-2 border-[#F4B860] shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><span className="text-2xl">🔍</span></div>
              <h3 className="text-2xl font-bold text-white">BioStackr</h3>
            </div>
            <ul className="space-y-4 text-lg text-white">
              <li className="flex items-start gap-3"><span className="text-[#F4B860] mt-1 font-bold">✓</span><span>Caffeine after 2pm → 38% worse sleep</span></li>
              <li className="flex items-start gap-3"><span className="text-[#F4B860] mt-1 font-bold">✓</span><span>Late workouts → Awake until 1am</span></li>
              <li className="flex items-start gap-3"><span className="text-[#F4B860] mt-1 font-bold">✓</span><span>Magnesium (3+ nights) → +2.1 sleep quality</span></li>
              <li className="flex items-start gap-3"><span className="text-[#F4B860] mt-1 font-bold">✓</span><span>Alcohol + screens → 67% worse REM</span></li>
              <li className="flex items-start gap-3"><span className="text-[#F4B860] mt-1 font-bold">✓</span><span>Morning walks → Asleep 30min faster</span></li>
            </ul>
            <p className="mt-8 text-base font-bold text-[#F4B860] text-center">Now you know what to fix.</p>
          </div>
        </div>
        <div className="bg-[#F4B860]/10 border-l-4 border-[#F4B860] p-8 rounded-lg max-w-4xl mx-auto">
          <p className="text-lg text-gray-800 leading-relaxed"><strong>Here's the thing:</strong> Your Oura ring, Whoop, Garmin, Eight Sleep mattress — they're all measuring the problem.</p>
          <p className="text-lg text-gray-800 leading-relaxed mt-4">BioStackr finds the <strong>cause</strong>.</p>
          <p className="text-lg text-gray-800 leading-relaxed mt-4">Got a wearable? Great. Log your sleep score in BioStackr along with everything else, and we'll analyze it all together. The score is just one data point — <strong>we find the patterns your wearable can't</strong>.</p>
        </div>
        <div className="text-center mt-10"><p className="text-gray-600 text-base">Stop guessing. Stop buying gadgets. Start knowing.</p></div>
      </div>
    </section>
  );
}


