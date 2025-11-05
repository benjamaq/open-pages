import Link from 'next/link'

export default function HowItWorks() {
  const steps = [
    { number: '1', icon: '✍️', title: '20-second check-in', description: 'Rate sleep/mood; tap what you did (caffeine, exercise, stress, late screens).' },
    { number: '2', icon: '🧠', title: 'We connect the dots', description: 'Hundreds of combinations, including timing, combos, and 24–48h lags.' },
    { number: '3', icon: '💡', title: 'You get actions, not charts', description: "'Move workouts to AM → sleep onset -47 min.'" },
    { number: '4', icon: '😴', title: 'Test & lock it in', description: "Repeat what worked, ditch what didn't." },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-4">
          <p className="text-lg text-gray-600 mb-2">It only takes 20 seconds a day to discover your patterns</p>
          <h2 className="text-4xl md:text-5xl font-bold">How You Go From Guessing → Knowing</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-8 mt-16 max-w-6xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-20 h-20 bg-[#F4B860]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">{s.icon}</span>
              </div>
              <div className="text-3xl font-bold text-[#F4B860] mb-3">{s.number}</div>
              <h3 className="text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-gray-600 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
        <div className="max-w-xl mx-auto bg-gray-50 rounded-xl p-5 mt-10">
          <div className="flex items-center justify-between text-center">
            <div className="flex-1">
              <div className="inline-block bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full mb-1">Day 1</div>
              <p className="text-sm text-gray-600">Baseline</p>
            </div>
            <div className="flex-1">
              <div className="inline-block bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full mb-1">Day 3-5</div>
              <p className="text-sm text-gray-600">Early signals</p>
            </div>
            <div className="flex-1">
              <div className="inline-block bg-amber-500 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full mb-1">Day 7-14</div>
              <p className="text-sm text-gray-600">First clear pattern</p>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">Private by default. Export or delete anytime.</p>
        </div>
      </div>
    </section>
  );
}


