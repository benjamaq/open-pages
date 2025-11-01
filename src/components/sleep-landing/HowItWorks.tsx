export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-2xl mb-2">1️⃣</div>
            <h3 className="font-bold mb-2">Track Sleep + Daily Factors</h3>
            <p className="text-gray-600 text-sm">Sleep quality + what you did yesterday (caffeine, food, stress, exercise). 20 seconds.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-2xl mb-2">2️⃣</div>
            <h3 className="font-bold mb-2">Track What You're Trying</h3>
            <p className="text-gray-600 text-sm">Track potential sleep disruptors: caffeine timing, alcohol, meals, exercise, screen time.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-2xl mb-2">3️⃣</div>
            <h3 className="font-bold mb-2">See Patterns Instantly</h3>
            <p className="text-gray-600 text-sm">See which days you slept well vs poorly, and what was different.</p>
          </div>
        </div>
      </div>
    </section>
  )
}


