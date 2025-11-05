export default function RealPeople() {
  const testimonials = [
    {
      initial: 'A',
      name: 'Alex, 29',
      location: 'Portland',
      quote: 'Cut afternoon coffee and phone out of bedroom. Fell asleep 30-45 min faster by day 12.',
      img: '/male image.png',
    },
    {
      initial: 'L',
      name: 'Lars, 38',
      location: 'Copenhagen',
      quote: 'Thought my sleep was fine. Patterns showed evening workouts wrecked me. Moved to mornings; sleep steadier within a week.',
      img: '/abstract image2.png',
    },
    {
      initial: 'M',
      name: 'Maya, 34',
      location: 'Toronto',
      quote: "Combo I missed: wine + short sleep = disaster. Avoided that combo, haven't had a 2 AM night in 10 days.",
      img: '/female image.png',
    },
  ];
  return (
    <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-3">Built for People Who’ve Already Tried Everything</h2>
        <p className="text-center text-gray-600 text-base md:text-lg mb-12 max-w-2xl mx-auto">From trial and error to clarity — here’s when things finally clicked.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left">
              <div className="flex items-center gap-3 mb-3">
                <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-purple-300" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.location}</p>
                </div>
              </div>
              <blockquote className="text-gray-700 leading-relaxed text-sm">“{t.quote}”</blockquote>
            </div>
          ))}
        </div>
        <div className="max-w-4xl mx-auto mt-12 text-center text-sm text-gray-500">What users discovered when they stopped guessing.</div>
      </div>
    </section>
  );
}


