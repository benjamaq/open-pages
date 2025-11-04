import Link from 'next/link'

export default function HowItWorks() {
  const steps = [
    { number: '1', icon: '✍️', title: 'Check in (20 seconds)', description: "How'd you sleep? How do you feel? What did you do yesterday?" },
    { number: '2', icon: '🧠', title: 'We analyze everything', description: 'Your sleep, caffeine, workouts, stress — all of it. Over 700 combinations per week.' },
    { number: '3', icon: '💡', title: 'You get answers, not graphs', description: "'Caffeine after 2pm ruins your sleep.' That's what you'll see in 7-14 days." },
    { number: '4', icon: '😴', title: 'Sleep again', description: "Try what works. Ditch what doesn't. Finally." },
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
        <div className="text-center mt-10">
          <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-full bg-[#F4B860] px-6 py-3 text-base font-semibold text-[#2C2C2C] hover:bg-[#E5A850] transition-colors whitespace-nowrap">Start Sleep Discovery →</Link>
        </div>
      </div>
    </section>
  );
}


