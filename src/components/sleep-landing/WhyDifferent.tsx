export default function WhyDifferent() {
  return (
    <section className="why-different py-16">
      <div className="max-w-4xl mx-auto text-center px-6">
        <p className="text-sm uppercase tracking-wide text-blue-600 mb-4">
          WHY BIOSTACKR IS DIFFERENT
        </p>
        <h2 className="text-4xl font-bold mb-6">
          Sleep trackers show you graphs.<br />
          We give you answers.
        </h2>
        <p className="text-xl text-gray-600 mb-12">
          Most sleep apps track <em>how</em> you slept.<br />
          BioStackr finds <em>what's causing bad sleep</em> — so you can actually fix it.
        </p>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="text-left p-6 bg-gray-50 rounded-lg">
            <h3 className="font-bold mb-4">😴 Other Sleep Trackers:</h3>
            <ul className="space-y-3">
              <li className="flex items-start"><span className="text-gray-400 mr-2">❌</span><span className="text-gray-600">Show you sleep graphs</span></li>
              <li className="flex items-start"><span className="text-gray-400 mr-2">❌</span><span className="text-gray-600">Track REM/deep sleep cycles</span></li>
              <li className="flex items-start"><span className="text-gray-400 mr-2">❌</span><span className="text-gray-600">Leave you guessing what to change</span></li>
              <li className="flex items-start"><span className="text-gray-400 mr-2">❌</span><span className="text-gray-600">Require complex manual data entry (too much work)</span></li>
            </ul>
          </div>
          <div className="text-left p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="font-bold mb-4">✨ BioStackr:</h3>
            <ul className="space-y-3">
              <li className="flex items-start"><span className="text-blue-600 mr-2">✓</span><span>Find <strong>what's causing</strong> bad sleep</span></li>
              <li className="flex items-start"><span className="text-blue-600 mr-2">✓</span><span>Track triggers: caffeine, food, stress, exercise timing</span></li>
              <li className="flex items-start"><span className="text-blue-600 mr-2">✓</span><span>Get <strong>actionable insights</strong>: "Skip dairy after 6pm"</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}


