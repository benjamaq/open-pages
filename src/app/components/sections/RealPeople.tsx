export default function RealPeople() {
  const testimonials = [
    {
      initial: 'A',
      name: 'Alex, 29',
      location: 'Insomnia · Portland',
      img: '/male image.png',
      story: [
        "I've had terrible sleep for like 3 years. Tried everything — magnesium, fancy sleep apps, even paid for a sleep coach who told me to 'relax more' which, thanks for nothing.",
        "Started using BioStackr mostly because I was desperate and it was free. After about 2 weeks it flagged that I was eating really late on weeknights (dinner around 9pm because of work). When I ate earlier, even by just an hour, I'd actually fall asleep.",
        "I'm still not perfect but I'm getting like 6 solid hours now instead of 4 broken ones. That's huge for me.",
      ],
    },
    {
      initial: 'L',
      name: 'Lars, 38',
      location: 'Poor Sleep · Copenhagen',
      img: '/abstract image2.png',
      story: [
        "Bought an Oura ring last year. Wasn't cheap — and basically just confirmed what I already knew — my sleep sucks. Didn't tell me why though.",
        "Someone mentioned this app in a Reddit thread. The AI picked up that my afternoon coffee was the problem. I drink it around 2-3pm thinking it's fine, but apparently it wasn't.",
        "Cut the afternoon coffee, sleep improved. Not like, amazing, but definitely better. Wish I'd known this before spending all that money on a ring.",
      ],
    },
    {
      initial: 'M',
      name: 'Maya, 34',
      location: 'Sleep Issues · Toronto',
      img: '/female image.png',
      story: [
        "I work late and then go to the gym around 8pm because that's when I have time. Never connected it to my sleep problems until I started tracking everything in here.",
        "The pattern was pretty clear after 10 days or so — late workouts = I'm wired until like 1am. Early morning workouts (even though I hate them) and I'm out by 11.",
        "Still adjusting but at least now I know what the problem is instead of just guessing.",
      ],
    },
  ];
  return (
    <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-3">Built for People Who’ve Already Tried Everything</h2>
        <p className="text-center text-gray-600 text-base md:text-lg mb-12 max-w-2xl mx-auto">From trial and error to clarity — here’s when things finally clicked.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <img src={t.img} alt={t.name} className="w-14 h-14 rounded-full object-cover border-2 border-purple-300" />
                <div>
                  <div className="font-bold text-lg">{t.name}</div>
                  <div className="text-sm text-gray-600">{t.location}</div>
                </div>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed text-[15px]">
                {t.story.map((p, pi) => (<p key={pi}>{p}</p>))}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-4xl mx-auto mt-12 text-center text-sm text-gray-500">What users discovered when they stopped guessing.</div>
      </div>
    </section>
  );
}



