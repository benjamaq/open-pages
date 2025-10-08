import Link from "next/link";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <Link href="/" className="hover:opacity-90 transition-opacity">
                <img 
                  src="/BIOSTACKR LOGO 2.png" 
                  alt="BioStackr" 
                  className="h-14 w-auto"
                />
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Link 
                href="/auth/signin" 
                className="text-gray-600 text-xs sm:text-sm hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-gray-900 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">Everything you need to know about BioStackr</p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            
            {/* Q1: Is this free? */}
            <div id="pricing" className="border-b border-gray-200 pb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Is this free?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Free for up to 12 items in your stack</strong> (supplements, meds, protocols combined). Most people never hit that limit.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Early users can DM me for a free pro code if you need more. I'm focused on building something useful, not maximizing revenue from day one.
              </p>
            </div>

            {/* Q2: Does it work on mobile? */}
            <div id="mobile" className="border-b border-gray-200 pb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Does it work on mobile?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Yes, works perfectly in mobile browsers</strong> (Safari, Chrome, etc.). Just open the site on your phone. No app download needed.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Native app might come later if people want it, but honestly the mobile web version works great. You can add it to your home screen for quick access.
              </p>
            </div>

            {/* Q3: Can I export my data? */}
            <div id="export" className="border-b border-gray-200 pb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Can I export my data?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Not yet, but it's on the roadmap.</strong> Everything stays in your account and you can screenshot or share your public link anytime.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Let me know if data export is critical for you - helps me prioritize features. I want to make sure you can get your data out in whatever format is most useful.
              </p>
            </div>

            {/* Q4: How is this different? */}
            <div id="difference" className="border-b border-gray-200 pb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How is this different from other tracking apps?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Most apps do ONE thing</strong> - either mood tracking OR supplement tracking. None connect them together.
              </p>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>BioStackr tracks:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>How you feel (mood, sleep, pain)</li>
                <li>What you take (supplements, meds, protocols)</li>
                <li>What you do (movement, mindfulness, therapies)</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mb-4">
                Then shows you a <strong>monthly heatmap</strong>. When you see a bad week, you click into those days and see exactly what you were taking/doing differently.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Like: <em>"Oh shit, my pain spiked the week I stopped taking magnesium"</em> or <em>"My sleep got way better after I added the morning walk."</em>
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                You can also add daily notes for context ("doctor appointment today, stressed") and keep a separate journal for longer reflections.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>The game-changer:</strong> You get a shareable link. Send it to your doctor before appointments instead of trying to remember everything. 
                Post it for your support community. Let people follow your journey and get notified when you update your stack or write a journal entry.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Privacy:</strong> Every single thing (supplements, protocols, journal entries) can be toggled private. You control exactly what's visible on your public link.
              </p>

              <p className="text-gray-700 leading-relaxed">
                <strong>Bonus:</strong> Optional daily email that says "Good morning - here's what you're taking today and what you have scheduled."
              </p>
            </div>

            {/* Q5: Is my data private? */}
            <div id="privacy" className="border-b border-gray-200 pb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Is my data private?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Everything is private by default.</strong> You get a shareable public link, but YOU control exactly what appears on it.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Every supplement, protocol, journal entry, and note can be toggled private/public individually.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>If you never share your link, no one sees anything.</strong> Your data is yours.
              </p>
            </div>

            {/* Q6: Who is this for? */}
            <div id="who" className="border-b border-gray-200 pb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Who is this for?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Anyone juggling multiple health interventions and trying to figure out what actually helps:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>Chronic pain patients trying different meds/treatments</li>
                <li>People with ADHD managing medication + lifestyle changes</li>
                <li>Biohackers running experiments on themselves</li>
                <li>Anyone who blanks when their doctor asks "how's the new medication working?"</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                <strong>If you take more than 3 things regularly</strong> (meds, supplements, protocols) and struggle to remember what's helping, this is for you.
              </p>
            </div>

            {/* Q7: Why should I trust this? */}
            <div id="trust" className="pb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Why should I trust a tool built by some guy on Reddit?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Fair question.</strong> I built this for my mum who has chronic pain and ADHD. She was trying 15+ different treatments and couldn't tell what was helping.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Doctors would ask "how's it going?" and she'd just say "I think okay?" No data. No patterns. Just vibes.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Started as a spreadsheet, but she couldn't use that. So I made it dead simple - <strong>10 seconds to log daily</strong>. 
                After a few weeks she could actually see patterns and have real conversations with her doctor.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                She's been using it for 4 months. It's helped her. Figured it might help other people dealing with the same struggle.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>I'm a developer by trade</strong>, this isn't some sketchy data-harvesting operation. Just trying to solve a real problem I watched someone I love struggle with.
              </p>
            </div>

          </div>

          {/* CTA */}
          <div className="mt-16 text-center bg-gray-50 rounded-2xl p-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h3>
            <p className="text-gray-600 mb-6">Reach out and I'll get back to you personally.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/contact"
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Contact Us
              </Link>
              <Link 
                href="/auth/signup"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 BioStackr. Built for people who believe health is a craft.</p>
            <div className="mt-4 flex justify-center space-x-6">
              <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
                Home
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
                Contact
              </Link>
              <Link href="/examples" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
                Examples
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
