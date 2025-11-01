import Link from 'next/link'
import PatternCarousel from './PatternCarousel'

export default function PatternExamples() {
  return (
    <section className="pattern-examples py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Patterns we help you find</h2>
        <PatternCarousel
          patterns={[
            { emoji: '☕', title: 'Caffeine Cutoff', description: 'Your sleep quality drops from 7/10 → 4/10 on nights you drink caffeine after 2pm.', insight: 'Even one coffee disrupts your sleep cycles hours later.', borderColor: 'border-green-200', bgColor: 'bg-green-50' },
            { emoji: '🍷', title: 'The Nightcap Myth', description: 'Your sleep quality drops to 4/10 on nights with alcohol vs 7/10 without.', insight: 'Alcohol helps you fall asleep but destroys sleep quality.', borderColor: 'border-yellow-200', bgColor: 'bg-yellow-50' },
            { emoji: '🥛', title: 'Dairy Discovery', description: 'Sleep quality drops from 7/10 → 4/10 when you eat dairy after 6pm.', insight: 'Late dairy causes digestive issues that disrupt sleep.', borderColor: 'border-red-200', bgColor: 'bg-red-50' },
            { emoji: '🏃', title: 'Exercise Window', description: 'Your sleep quality drops to 4/10 when you exercise after 7pm vs 7/10 earlier in the day.', insight: 'Evening workouts spike cortisol and keep you wired.', borderColor: 'border-blue-200', bgColor: 'bg-blue-50' },
            { emoji: '📱', title: 'Blue Light Effect', description: 'Your sleep quality averages 3/10 on nights with 2+ hours of screen time before bed vs 7/10 without.', insight: 'Blue light suppresses melatonin production.', borderColor: 'border-purple-200', bgColor: 'bg-purple-50' },
            { emoji: '😰', title: 'Stress Timing', description: 'Your sleep quality drops to 5/10 on high-stress days vs 7/10 on calm days.', insight: 'Cortisol takes 6-8 hours to normalize after stress.', borderColor: 'border-orange-200', bgColor: 'bg-orange-50' },
            { emoji: '🌡️', title: 'Room Temperature', description: 'Your sleep quality drops from 7/10 → 4/10 when room temp is above 70°F (21°C).', insight: 'Your body needs cool temps (65-68°F) to enter deep sleep.', borderColor: 'border-blue-300', bgColor: 'bg-blue-50' },
            { emoji: '🌑', title: 'Light Exposure', description: 'Your sleep quality averages 4/10 in rooms with ambient light vs 7/10 in complete darkness.', insight: 'Even small amounts of light disrupt melatonin production.', borderColor: 'border-indigo-300', bgColor: 'bg-indigo-50' },
            { emoji: '🌙', title: 'Consistent Bedtime', description: 'Your sleep quality averages 5/10 when bedtime varies by 2+ hours vs 7/10 with consistent timing.', insight: 'Your circadian rhythm needs routine to function well.', borderColor: 'border-purple-300', bgColor: 'bg-purple-50' },
            { emoji: '📱', title: 'Late-Night Scrolling', description: 'Your sleep quality drops to 4/10 on nights you scroll your phone in bed vs 7/10 without.', insight: 'Mental stimulation + blue light = terrible combination for sleep.', borderColor: 'border-red-300', bgColor: 'bg-red-50' },
            { emoji: '📵', title: 'Phone in Bedroom', description: "Your sleep quality averages 5/10 when phone is in bedroom vs 7/10 when it's in another room.", insight: 'Just knowing your phone is nearby creates subconscious alertness.', borderColor: 'border-gray-300', bgColor: 'bg-gray-50' },
            { emoji: '🧠', title: 'Racing Thoughts', description: "Your sleep quality drops to 4/10 on nights you log 'busy mind' vs 7/10 on calm nights.", insight: 'Mental stress keeps your nervous system activated, preventing deep sleep.', borderColor: 'border-orange-300', bgColor: 'bg-orange-50' },
            { emoji: '🛁', title: 'Pre-Sleep Routine', description: 'Your sleep quality averages 7/10 on nights with a 30-minute wind-down vs 4/10 without.', insight: 'Your body needs a consistent signal that it\'s time to sleep.', borderColor: 'border-teal-300', bgColor: 'bg-teal-50' },
            { emoji: '🥗', title: 'Dinner Timing', description: 'Your sleep quality averages 4/10 when you eat dinner after 8pm vs 7/10 before 7pm.', insight: 'Active digestion disrupts your sleep cycles.', borderColor: 'border-lime-300', bgColor: 'bg-lime-50' },
          ]}
        />
        <div className="text-center mt-12">
          <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-lg transition-colors">
            Find My Sleep Triggers
          </Link>
        </div>
      </div>
    </section>
  )
}


