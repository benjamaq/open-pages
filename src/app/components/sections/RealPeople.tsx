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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">Built for People Who've Already Tried Everything</h2>
        <p className="text-center text-gray-600 text-lg mb-16 max-w-2xl mx-auto">Real stories. Real breakthroughs. Usually in 7-14 days.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow text-center">
              <img src={t.img} alt={t.name} className="w-20 h-20 rounded-full object-cover border-4 border-purple-500 mx-auto mb-4" />
              <blockquote className="text-gray-700 italic mb-3">“{t.quote}”</blockquote>
              <p className="text-sm font-semibold text-gray-700">— {t.name}, {t.location}</p>
            </div>
          ))}
        </div>
        {/* Footer line removed to let stories speak for themselves */}
      </div>
    </section>
  );
}


