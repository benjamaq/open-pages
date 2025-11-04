export default function RealPatternsCarousel() {
  const patterns = [
    {
      icon: "💬",
      title: "Hard conversations timing",
      person: "Jamie · Seattle",
      worseCondition: "Life admin/tough talks after 8pm",
      worseOutcome: "Wired until 2am",
      betterCondition: "Save heavy stuff for weekends",
      betterOutcome: "Mind actually rests",
      quote: "We'd hash out kid stuff, money problems at night. I'd be wired for hours. Saturday mornings now — sleep improved immediately.",
    },
    {
      icon: "📱",
      title: "Phone in bedroom",
      person: "Marcus · Austin",
      worseCondition: "Phone on nightstand",
      worseOutcome: "'Just checking' = 45min scrolling",
      betterCondition: "Phone in another room",
      betterOutcome: "Bed is for sleeping, not scrolling",
      quote: "I'd tell myself I'm just checking the time. Next thing it's 1am. Phone out of bedroom = I actually go to bed to sleep.",
    },
    {
      icon: "💼",
      title: "Evening mental load",
      person: "Sarah · London",
      worseCondition: "Admin/emails after 9pm",
      worseOutcome: "Brain won't shut off",
      betterCondition: "Hard stop at 8pm",
      betterOutcome: "Mind decompresses",
      quote: "Bills, emails, planning tomorrow — all at night. Couldn't switch off. Morning admin instead = way better sleep.",
    },
    {
      icon: "🍝",
      title: "Late meal timing",
      person: "Tom · Copenhagen",
      worseCondition: "Dinner after 8:30pm",
      worseOutcome: "Digesting when should be resting",
      betterCondition: "Eat by 7:30pm",
      betterOutcome: "Body winds down naturally",
      quote: "Ate at 9pm because of work. Body too busy digesting to sleep. Earlier meals fixed it.",
    },
    {
      icon: "🍷",
      title: "Alcohol timing window",
      person: "Emma · Dublin",
      worseCondition: "Wine at 9:30pm",
      worseOutcome: "Awake at 3am every time",
      betterCondition: "Wine at 6pm or skip",
      betterOutcome: "Sleep through night",
      quote: "Glass of wine at 9:30 to 'relax' = 3am wake-up. Same wine at 6pm with dinner? Fine. Timing is everything.",
    },
    {
      icon: "💊",
      title: "Supplement timing",
      person: "Alex · Portland",
      worseCondition: "All supplements at dinner",
      worseOutcome: "Wired until midnight",
      betterCondition: "Morning supplements only",
      betterOutcome: "No evening stimulation",
      quote: "Taking everything at dinner thinking it'd help. B-vitamins at night = coffee. Morning = immediate difference.",
    },
    {
      icon: "🏋️",
      title: "Evening workout timing",
      person: "Lisa · Vancouver",
      worseCondition: "Gym at 8:30pm",
      worseOutcome: "Can't sleep before 1am",
      betterCondition: "Lunch break workouts",
      betterOutcome: "Normal sleep pattern",
      quote: "Hit gym at 8:30 because that's when I had time. Couldn't sleep until 1am. Lunch workouts = better.",
    },
    {
      icon: "💉",
      title: "Pain medication cycling",
      person: "Rachel · Toronto",
      worseCondition: "Meds at 10pm",
      worseOutcome: "Wear off at 3am, wake in pain",
      betterCondition: "Cycle earlier + lighter evening",
      betterOutcome: "Sleep through night",
      quote: "Fibromyalgia meds at night wore off at 3am. Cycling earlier through day + light bedtime dose = pain controlled, sleep restored.",
    },
    {
      icon: "📰",
      title: "Screen content (not light)",
      person: "Nina · Berlin",
      worseCondition: "News/Twitter before bed",
      worseOutcome: "Anxiety, can't switch off",
      betterCondition: "Fiction on Kindle",
      betterOutcome: "Actually relaxing",
      quote: "Reading news spins my brain for hours. Switch to fiction and I'm out in 20. Content matters, not the device.",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-teal-700 to-amber-600">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">Real Patterns BioStackr Discovers</h2>
        <p className="text-xl text-white/90 text-center mb-16">The hidden connections you'd never spot on your own</p>
        <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar">
          {patterns.map((pattern, index) => (
            <div key={index} className="flex-shrink-0 w-80 bg-white rounded-2xl p-6 shadow-xl snap-start">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{pattern.icon}</span>
                <div>
                  <h3 className="font-bold text-lg">{pattern.title}</h3>
                  <p className="text-sm text-gray-600">{pattern.person}</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                  <p className="text-sm font-medium text-gray-800">{pattern.worseCondition}</p>
                  <p className="text-xs text-red-600 mt-1">{pattern.worseOutcome}</p>
                </div>
                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                  <p className="text-sm font-medium text-gray-800">{pattern.betterCondition}</p>
                  <p className="text-xs text-green-600 mt-1">{pattern.betterOutcome}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">"{pattern.quote}"</p>
            </div>
          ))}
        </div>
        <p className="text-center text-white/80 text-sm mt-8">These aren't generic tips. These are YOUR patterns.</p>
      </div>
    </section>
  );
}


