export default function SocialProofBar() {
  return (
    <section className="social-proof bg-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-sm text-gray-600 mb-6">
          Trusted by 1,000+ people tracking their health
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm mb-2">
              "Discovered dairy after 6pm destroyed my sleep. Fixed in 3 days."
            </p>
            <p className="text-xs text-gray-500">— Emma, fibromyalgia</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm mb-2">
              "Caffeine after 2pm was the culprit. Down from 3 hours to fall asleep → 20 minutes."
            </p>
            <p className="text-xs text-gray-500">— Marcus, chronic pain</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm mb-2">
              "Exercise timing was the issue. Evening workouts kept me wired until 2am."
            </p>
            <p className="text-xs text-gray-500">— Jordan, ADHD</p>
          </div>
        </div>
      </div>
    </section>
  )
}


