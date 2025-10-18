import Link from "next/link";

export default function Home() {
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
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
              <Link href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</Link>
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

      {/* Mobile Privacy Badge (sticky) */}
      <div className="md:hidden fixed top-2 right-2 z-50">
        <div className="bg-white/95 border border-gray-200 rounded-full px-3 py-1 shadow-sm text-xs text-gray-800">
          🔒 Private by default
        </div>
      </div>

      {/* Hero Section */}
      <section style={{ background: '#FFFFFF', padding: '100px 40px 80px', maxWidth: 1400, margin: '0 auto' }}>
        {/* New Hero Two-Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
              {/* LEFT COLUMN: Text */}
              <div>
                {/* Next Generation badge */}
                <div style={{ textAlign: 'left', marginBottom: 20 }}>
                  <p style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, color: '#6366f1', fontWeight: 600, marginBottom: 10 }}>
                    The next generation of health tracking
                  </p>
                </div>
                <div style={{ display: 'inline-block', background: '#1F2937', color: 'white', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  BETA
                </div>
                <h1 style={{ fontSize: 56, lineHeight: 1.15, marginBottom: 30, fontWeight: 700, color: '#1F2937' }}>
                  You're trying everything to manage your pain.
                </h1>
                <p style={{ fontSize: 20, lineHeight: 1.6, color: '#4B5563', marginBottom: 20 }}>
                  Meds. Supplements. Protocols. Cutting out foods. New treatments.
                </p>
                <p style={{ fontSize: 20, lineHeight: 1.6, color: '#1F2937', fontWeight: 600, marginBottom: 35 }}>
                  But you have no idea what's actually helping.
                </p>
                <p style={{ fontSize: 18, lineHeight: 1.7, color: '#374151', marginBottom: 20 }}>
                  BioStackr connects your pain, mood & sleep to everything you're trying—revealing the patterns that show you what actually works.
                </p>
                <p style={{ fontSize: 18, lineHeight: 1.7, color: '#374151', marginBottom: 40 }}>
                  Unlike other apps that leave you drowning in data, we tell you what it means and what to try next.
                </p>
                <div style={{ display: 'flex', gap: 15, alignItems: 'center', marginBottom: 20 }}>
                  <a href="/auth/signup" style={{ background: '#1F2937', color: 'white', padding: '16px 32px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>Start Tracking Free</a>
                  <a href="/examples" style={{ background: 'white', color: '#1F2937', padding: '16px 32px', borderRadius: 8, border: '2px solid #E5E7EB', fontSize: 16, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>See examples</a>
                </div>
                <p style={{ fontSize: 14, color: '#6B7280', marginTop: 20 }}>
                  Private by default • Share only what you choose<br/>
                  Built for people living with fibromyalgia, autoimmune conditions, chronic pain, and chronic illness.
                </p>
              </div>
              {/* RIGHT COLUMN: Use existing mockup card */}
              <div>
                {/* Hero Magic Moment Mockup: Before (check-in) → After (insight) */}
                <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
                  <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {/* Top: Daily Check-in */}
                    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20, color: 'white' }}>
                      <h3 style={{ fontSize: 16, margin: '0 0 15px 0', fontWeight: 600 }}>Today's Check-in</h3>
                      {/* Pain */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13 }}>Pain level</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>7/10</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.3)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ background: '#EF4444', width: '70%', height: '100%' }} />
                        </div>
                      </div>
                      {/* Mood */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13 }}>Mood</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>6/10</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.3)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ background: '#fbbf24', width: '60%', height: '100%' }} />
                        </div>
                      </div>
                      {/* Sleep Quality (NEW) */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13 }}>Sleep quality</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>8/10</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.3)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ background: '#10b981', width: '80%', height: '100%' }} />
                        </div>
                      </div>
                      {/* Chips */}
                <div style={{ display: 'flex', gap: 6, marginTop: 15, flexWrap: 'wrap' }}>
                        <span style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '1.5px solid #10b981', padding: '8px 14px', borderRadius: 20, fontSize: 12, color: '#065f46', fontWeight: 500, boxShadow: '0 1px 3px rgba(16,185,129,0.15)' }}>✅ Magnesium taken</span>
                        <span style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1.5px solid #f59e0b', padding: '8px 14px', borderRadius: 20, fontSize: 12, color: '#78350f', fontWeight: 500, boxShadow: '0 1px 3px rgba(245,158,11,0.15)' }}>😴 Good sleep</span>
                      </div>
                      <p style={{ margin: '15px 0 0 0', fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>20 seconds. Done.</p>
                    </div>
                    {/* Divider */}
                    <div style={{ background: '#f3f4f6', padding: '12px 20px', textAlign: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 18 }}>✨</div>
                      <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>BioStackr analyzes patterns</p>
                    </div>
                    {/* Bottom: Insight */}
                    <div style={{ padding: 20, background: 'white' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧠</div>
                        <div>
                          <strong style={{ fontSize: 14, color: '#1a1a1a', display: 'block' }}>Pattern detected</strong>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Based on 14 days of data</span>
                        </div>
                      </div>
                      <div style={{ background: '#f0fdf4', borderLeft: '3px solid #10b981', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
                          <strong>Your pain drops to 3/10 when you take magnesium consistently</strong> — but spikes to 7/10 when you miss it.
                        </p>
                      </div>
                      <div style={{ background: '#eff6ff', borderLeft: '3px solid #3b82f6', padding: 12, borderRadius: 6 }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#1e40af', fontWeight: 600 }}>What to try next:</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>Set a reminder for evening magnesium. This pattern showed up 6 times over 2 weeks.</p>
                      </div>
                    </div>
                  </div>
                  {/* Floating badge */}
                  <div style={{ position: 'absolute', top: -15, right: -15, background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>This is the difference</div>
                </div>
              </div>
            </div>
      </section>

      
      
      

      {/* Strategic Positioning (neutral) */}
      <section style={{ background: '#f8f9fa', padding: '60px 20px', textAlign: 'center', marginTop: 60 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: '#e3f2fd', padding: '6px 16px', borderRadius: 20, marginBottom: 20, fontSize: 14, fontWeight: 600, color: '#1976d2' }}>💡 Why We're Different</div>
          <h2 style={{ fontSize: 32, marginBottom: 20, color: '#1a1a1a', fontWeight: 700 }}>Not just another tracking app</h2>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: '#666', marginBottom: 30 }}>Most health trackers are great at collecting data.<br/>But they leave you to figure out what it all means.</p>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: '#666', marginBottom: 40 }}>
            <strong style={{ color: '#1a1a1a', fontSize: 20 }}>They show you graphs.<br/>We give you answers.</strong>
          </p>
          <div style={{ background: 'white', borderRadius: 12, padding: 35, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: 600, margin: '0 auto' }}>
            <p style={{ fontSize: 18, marginBottom: 25, color: '#1a1a1a', fontWeight: 600 }}>BioStackr is different:</p>
            <div style={{ textAlign: 'left' }}>
              <p style={{ marginBottom: 15, color: '#666', fontSize: 16, lineHeight: 1.6 }}>✅ Same tracking power you expect</p>
              <p style={{ marginBottom: 15, color: '#666', fontSize: 16, lineHeight: 1.6 }}>✅ Intelligent guidance that <strong style={{ color: '#1a1a1a' }}>actually explains what's happening</strong></p>
              <p style={{ marginBottom: 15, color: '#666', fontSize: 16, lineHeight: 1.6 }}>✅ And <strong style={{ color: '#1a1a1a' }}>tells you exactly what to try next</strong></p>
              <p style={{ color: '#666', fontSize: 16, lineHeight: 1.6 }}>✅ All in <strong style={{ color: '#1a1a1a' }}>20 seconds a day</strong> (not 10+ minutes)</p>
            </div>
          </div>
          <p style={{ marginTop: 30, fontSize: 14, color: '#999', fontStyle: 'italic' }}>📱 Wearable user? Drop in your daily recovery score (5 seconds). Automatic sync coming soon.</p>
        </div>
      </section>

      {/* Problem: You're tracking in chaos (moved up per order) */}
      <section style={{ background: '#F9FAFB', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">You're tracking in chaos</h2>
            <p className="text-gray-600 mt-3">Notes, screenshots, voice memos—no patterns, just noise.</p>
          </div>
          <p style={{ textAlign: 'center', fontSize: 17, color: '#1a1a1a', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
            <strong>Tracking apps make you work too hard.</strong><br/>
            BioStackr gives you smart defaults, takes 20 seconds daily, and actually tells you what to do.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-xl mb-3" aria-hidden>📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes in ten places</h3>
              <p className="text-gray-600 text-sm">Notes in ten places. Screenshots. Voice memos. All noise, no patterns.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-xl mb-3" aria-hidden>🩺</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your doctor doesn't listen</h3>
              <p className="text-gray-600 text-sm">You show them your tracking and they glaze over. You leave feeling dismissed.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-xl mb-3" aria-hidden>❓</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Still Guessing</h3>
              <p className="text-gray-600 text-sm">Was it the new supplement? The stress? The food? You have no idea what's working.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: The Intelligence Layer */}
      <section style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '80px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: 50, marginBottom: 20, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              ⏱️ Just 20 seconds a day
            </div>
            <h2 style={{ fontSize: 48, marginBottom: 20, fontWeight: 700, lineHeight: 1.2 }}>You check in. We do the rest.</h2>
            <p style={{ fontSize: 22, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', maxWidth: 700, margin: '0 auto' }}>
              While you focus on your day, BioStackr's intelligent system works in the background—connecting patterns, spotting triggers, and uncovering what actually helps.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
            {/* LEFT: Quick Check-In Visual */}
            <div>
              <div style={{ background: 'white', borderRadius: 16, padding: 35, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 25 }}>Your Daily Check-In</div>
                {/* Pain Slider */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#6B7280', fontSize: 14 }}>
                    <span>Pain level</span>
                    <span style={{ fontWeight: 600, color: '#1F2937' }}>7/10</span>
                  </div>
                  <div style={{ background: '#E5E7EB', height: 8, borderRadius: 4 }}>
                    <div style={{ background: '#F97316', height: '100%', width: '70%', borderRadius: 4 }}></div>
                  </div>
                </div>
                {/* Mood Slider */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#6B7280', fontSize: 14 }}>
                    <span>Mood</span>
                    <span style={{ fontWeight: 600, color: '#1F2937' }}>5/10</span>
                  </div>
                  <div style={{ background: '#E5E7EB', height: 8, borderRadius: 4 }}>
                    <div style={{ background: '#EAB308', height: '100%', width: '50%', borderRadius: 4 }}></div>
                  </div>
                </div>
                {/* Sleep Slider */}
                <div style={{ marginBottom: 25 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#6B7280', fontSize: 14 }}>
                    <span>Sleep quality</span>
                    <span style={{ fontWeight: 600, color: '#1F2937' }}>3/10</span>
                  </div>
                  <div style={{ background: '#E5E7EB', height: 8, borderRadius: 4 }}>
                    <div style={{ background: '#EF4444', height: '100%', width: '30%', borderRadius: 4 }}></div>
                  </div>
                </div>
                {/* Readiness Score */}
                <div style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', padding: 20, borderRadius: 12, marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: '#78350F', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Today's Readiness Score</div>
                  <div style={{ fontSize: 42, fontWeight: 700, color: '#78350F', marginBottom: 8 }}>64</div>
                  <div style={{ fontSize: 14, color: '#92400E', lineHeight: 1.5 }}>Take it easy today. Your body needs rest.</div>
                </div>
                <button style={{ width: '100%', background: '#1F2937', color: 'white', padding: 14, borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Log Check-In</button>
                <p style={{ textAlign: 'center', marginTop: 12, color: '#6B7280', fontSize: 14 }}>20 seconds. Done.</p>
              </div>
              {/* Ellie message */}
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: 20, marginTop: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>👩</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5, opacity: 0.9 }}>Ellie</div>
                    <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, opacity: 0.95 }}>
                      "I see your pain is higher than usual this morning. We've tracked some patterns over the last few days that might help. Keep checking in—clarity is coming. 💙"
                    </p>
                  </div>
                </div>
              </div>

              {/* Chips visuals */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                {/* Lifestyle Context Chips */}
                <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10, opacity: 0.9 }}>Lifestyle</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ padding: '6px 10px', background: 'white', color: '#111827', borderRadius: 999, fontSize: 12, border: '1px solid #E5E7EB' }}>😴 Poor sleep</span>
                    <span style={{ padding: '6px 10px', background: 'white', color: '#111827', borderRadius: 999, fontSize: 12, border: '1px solid #E5E7EB' }}>🍞 Ate gluten</span>
                    <span style={{ padding: '6px 10px', background: 'white', color: '#111827', borderRadius: 999, fontSize: 12, border: '1px solid #E5E7EB' }}>💼 High stress</span>
                    <span style={{ padding: '6px 10px', background: 'white', color: '#111827', borderRadius: 999, fontSize: 12, border: '1px solid #E5E7EB' }}>🏃 Gentle movement</span>
                  </div>
                </div>
                {/* Symptoms Chips */}
                <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10, opacity: 0.9 }}>Symptoms</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ padding: '6px 10px', background: 'white', color: '#111827', borderRadius: 999, fontSize: 12, border: '1px solid #E5E7EB' }}>🦴 Joint pain</span>
                    <span style={{ padding: '6px 10px', background: 'white', color: '#111827', borderRadius: 999, fontSize: 12, border: '1px solid #E5E7EB' }}>🧠 Brain fog</span>
                    <span style={{ padding: '6px 10px', background: 'white', color: '#111827', borderRadius: 999, fontSize: 12, border: '1px solid #E5E7EB' }}>🤒 Fatigue</span>
                    <span style={{ padding: '6px 10px', background: 'white', color: '#111827', borderRadius: 999, fontSize: 12, border: '1px solid #E5E7EB' }}>💢 Migraine</span>
                  </div>
                </div>
              </div>
            </div>
            {/* RIGHT: Intelligence explanation */}
            <div>
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: 16, padding: 40, border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>🧠</div>
                <h3 style={{ fontSize: 28, marginBottom: 20, fontWeight: 600, lineHeight: 1.3 }}>The most sophisticated pattern recognition system for chronic pain— with patterns explained in plain English</h3>
                <p style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 25, opacity: 0.95 }}>
                  BioStackr uses advanced machine learning to analyze thousands of data points across your pain levels, sleep quality, medications, supplements, and daily activities.
                </p>
                <p style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 30, opacity: 0.95 }}>
                  While other apps just let you log data, BioStackr actively searches for connections you'd never spot on your own—like how your pain spikes 24 hours after missing your magnesium, or how stress on Tuesdays triggers Wednesday flares.
                </p>
                <div style={{ marginBottom: 15 }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 15 }}>
                    <div style={{ width: 24, height: 24, background: 'rgba(16, 185, 129, 0.2)', border: '2px solid rgba(16, 185, 129, 0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <div style={{ width: 10, height: 10, background: '#10B981', borderRadius: '50%' }}></div>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Multi-dimensional analysis</div>
                      <div style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.5 }}>Connects pain, sleep, mood, medications, weather, stress, and more</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 15 }}>
                    <div style={{ width: 24, height: 24, background: 'rgba(16, 185, 129, 0.2)', border: '2px solid rgba(16, 185, 129, 0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <div style={{ width: 10, height: 10, background: '#10B981', borderRadius: '50%' }}></div>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Time-lag detection</div>
                      <div style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.5 }}>Spots delayed triggers (like how yesterday's stress causes today's flare)</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                    <div style={{ width: 24, height: 24, background: 'rgba(16, 185, 129, 0.2)', border: '2px solid rgba(16, 185, 129, 0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <div style={{ width: 10, height: 10, background: '#10B981', borderRadius: '50%' }}></div>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Learns your unique patterns</div>
                      <div style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.5 }}>Gets smarter the longer you use it, tailored to your specific condition</div>
                    </div>
                  </div>
                </div>
                {/* Plain-English patterns bullet */}
                <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginTop: 12 }}>
                  <div style={{ width: 24, height: 24, background: 'rgba(16, 185, 129, 0.2)', border: '2px solid rgba(16, 185, 129, 0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <div style={{ width: 10, height: 10, background: '#10B981', borderRadius: '50%' }}></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Plain‑English patterns (not medical jargon)</div>
                    <div style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.5 }}>
                      "Your pain drops 40% on magnesium days" — not just graphs you have to decode
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: 25, marginTop: 20, border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 600, margin: 0, opacity: 0.95 }}>
                  This isn't a simple tracker. It's a pattern recognition engine built specifically for chronic conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Relief Break #1 will be inserted after 'From check-in to breakthrough' */}
      {/* From check-in to breakthrough (Version A - Two-panel) */}
      <section style={{ background: '#f8f9fa', padding: '80px 20px', marginTop: 0 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <p style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.5, color: '#6366f1', fontWeight: 600, marginBottom: 10 }}>See it in action</p>
            <h2 style={{ fontSize: 36, marginBottom: 15, color: '#1a1a1a', fontWeight: 700, lineHeight: 1.2 }}>From check-in to breakthrough</h2>
            <p style={{ color: '#666', fontSize: 17, maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>Watch how a simple 20-second check-in becomes personalized guidance</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 35, alignItems: 'start', marginBottom: 50 }}>
            {/* Left panel */}
            <div>
              <h3 style={{ fontSize: 19, color: '#1a1a1a', marginBottom: 20, fontWeight: 600 }}>Ben's morning check-in</h3>
              <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 15 }}>
                <p style={{ margin: '0 0 18px 0', fontSize: 13, color: '#9ca3af' }}>Today, 8:42 AM</p>
                {/* Pain */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Pain level</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>8/10</span>
                  </div>
                  <div style={{ background: '#f3f4f6', height: 7, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ background: '#ef4444', width: '80%', height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
                {/* Mood */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Mood</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>3/10</span>
                  </div>
                  <div style={{ background: '#f3f4f6', height: 7, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ background: '#f59e0b', width: '30%', height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
                {/* Sleep */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Sleep quality</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>4/10</span>
                  </div>
                  <div style={{ background: '#f3f4f6', height: 7, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ background: '#f59e0b', width: '40%', height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
                {/* Symptoms */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Symptoms today:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    <span style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '7px 13px', borderRadius: 16, fontSize: 13, color: '#991b1b', fontWeight: 500 }}>🧠 Brain fog</span>
                    <span style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '7px 13px', borderRadius: 16, fontSize: 13, color: '#991b1b', fontWeight: 500 }}>💪 Muscle pain</span>
                    <span style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '7px 13px', borderRadius: 16, fontSize: 13, color: '#991b1b', fontWeight: 500 }}>😴 Fatigue</span>
                  </div>
                </div>
                {/* Context */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>What's been happening:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    <span style={{ background: '#fef9c3', border: '1px solid #fde047', padding: '7px 13px', borderRadius: 16, fontSize: 13, color: '#854d0e', fontWeight: 500 }}>⚠️ High stress</span>
                    <span style={{ background: '#fef9c3', border: '1px solid #fde047', padding: '7px 13px', borderRadius: 16, fontSize: 13, color: '#854d0e', fontWeight: 500 }}>💤 Poor sleep</span>
                    <span style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '7px 13px', borderRadius: 16, fontSize: 13, color: '#991b1b', fontWeight: 500 }}>❌ Missed magnesium</span>
                  </div>
                </div>
              </div>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>20 seconds to log. Then Elli takes over.</p>
            </div>
            {/* Right panel */}
            <div>
              <h3 style={{ fontSize: 19, color: '#1a1a1a', marginBottom: 20, fontWeight: 600 }}>Elli's response</h3>
              <div style={{ background: 'white', borderRadius: 14, padding: 26, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 20 }}>
                  <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, flexShrink: 0 }}>💜</div>
                  <div>
                    <strong style={{ fontSize: 17, color: '#1a1a1a', display: 'block', lineHeight: 1.3 }}>Elli</strong>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>Just now</span>
                  </div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 13, padding: 22, lineHeight: 1.65 }}>
                  <p style={{ margin: '0 0 20px 0', fontSize: 15, color: '#374151' }}>Hey Ben, really sorry to see you're having such an intense pain day. That 8/10 with brain fog and fatigue sounds exhausting. 💙</p>
                  <div style={{ background: 'white', borderLeft: '4px solid #f59e0b', padding: 16, borderRadius: 9, marginBottom: 20 }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#92400e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>I noticed a pattern:</p>
                    <p style={{ margin: 0, fontSize: 15, color: '#78350f', lineHeight: 1.6 }}>Your pain spikes to <strong style={{ color: '#451a03' }}>7-8/10 within 48 hours of missing magnesium</strong>—but drops to <strong style={{ color: '#451a03' }}>3-4/10 when you take it consistently</strong> for 3+ days.</p>
                  </div>
                  <p style={{ margin: '0 0 20px 0', fontSize: 15, color: '#374151' }}>This has happened <strong style={{ color: '#1a1a1a' }}>5 times over the past month</strong>. The connection is clear.</p>
                  <div style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: 16, borderRadius: 9 }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: 13, color: '#1e40af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>What to try:</p>
                    <p style={{ margin: 0, fontSize: 15, color: '#1e40af', lineHeight: 1.6 }}>Set a daily reminder for evening magnesium. Your body's clearly telling us it needs this consistency. Want me to help you track it better?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', paddingTop: 35, borderTop: '1px solid #d1d5db' }}>
            <p style={{ fontSize: 18, color: '#1a1a1a', fontWeight: 600, marginBottom: 10, lineHeight: 1.4 }}>Empathy first. Patterns second. Guidance always.</p>
            <p style={{ fontSize: 15, color: '#6b7280', fontStyle: 'italic' }}>Not cold data analysis. Real support.</p>
          </div>
        </div>
      </section>

      {/* RELIEF BREAK #1 (exact HTML, after section 5) */}
      <section style={{ textAlign: 'center', padding: '60px 20px', background: '#fafbfc' }}>
        <p style={{ fontSize: 18, color: '#666', maxWidth: 650, margin: '0 auto', lineHeight: 1.8, fontStyle: 'italic' }}>
          You don't need another app promising miracles.<br/>
          You need someone who understands — and a system that actually listens.
        </p>
      </section>

      {/* What happens when you finally see patterns (Outcome Snapshot) */}
      <section style={{ background: '#F9FAFB', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="section-title" style={{ marginBottom: 15 }}>What happens when you finally see patterns</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ padding: 30 }}>
              <div style={{ fontSize: 48, color: '#10B981', marginBottom: 20 }}>✓</div>
              <h3 className="subsection-title" style={{ fontSize: 24, marginBottom: 15 }}>You stop guessing</h3>
              <p className="body-text" style={{ fontSize: 16 }}>No more wondering if it was the supplement, the stress, or the food. Patterns become clear.</p>
            </div>
            <div style={{ padding: 30 }}>
              <div style={{ fontSize: 48, color: '#10B981', marginBottom: 20 }}>✓</div>
              <h3 className="subsection-title" style={{ fontSize: 24, marginBottom: 15 }}>Your doctor listens</h3>
              <p className="body-text" style={{ fontSize: 16 }}>Show them clear data they can't dismiss. Finally be taken seriously.</p>
            </div>
            <div style={{ padding: 30 }}>
              <div style={{ fontSize: 48, color: '#10B981', marginBottom: 20 }}>✓</div>
              <h3 className="subsection-title" style={{ fontSize: 24, marginBottom: 15 }}>You start making choices that help</h3>
              <p className="body-text" style={{ fontSize: 16 }}>Know what actually reduces your pain. Make informed decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof: Here's what pattern discovery looks like (moved up to position 8) */}
      <section style={{ background: 'white', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p className="section-label">Next-generation pattern recognition</p>
            <h2 className="section-title" style={{ fontSize: 32 }}>Here's what pattern discovery looks like</h2>
            <p className="body-text" style={{ textAlign: 'center', marginBottom: 40, fontStyle: 'italic' }}>Not just graphs you decode yourself. Real patterns. Real answers.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 20, textTransform: 'uppercase' }}>Priya's Story</div>
              <h3 style={{ fontSize: 28, marginBottom: 20, fontWeight: 600, color: '#1F2937' }}>The Magnesium Discovery</h3>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#374151', marginBottom: 20 }}>Priya had chronic migraines for 3 years. She tried everything—cutting caffeine, new pillows, meditation, expensive supplements.</p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#1F2937', marginBottom: 20, fontWeight: 600 }}>Nothing worked. She had no idea what was helping.</p>
              <div style={{ background: '#F3F4F6', borderLeft: '4px solid #10B981', padding: 20, margin: '30px 0', borderRadius: 4 }}>
                <p style={{ fontSize: 17, lineHeight: 1.7, color: '#1F2937', margin: 0 }}>After 2 weeks of tracking in BioStackr, <strong>the pattern jumped out:</strong></p>
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#374151', marginBottom: 15 }}>Every time she took <strong>Magnesium 400mg</strong> consistently for 3+ days, her pain dropped from <span style={{ color: '#EF4444', fontWeight: 600 }}>7/10</span> to <span style={{ color: '#10B981', fontWeight: 600 }}>3/10</span>.</p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#374151', marginBottom: 15 }}>When she missed it, migraines came back within 48 hours.</p>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#374151', marginBottom: 30 }}>She showed her doctor. They adjusted her dosage. <strong>Now she knows exactly what helps.</strong></p>
              <div style={{ background: '#FEF3C7', padding: 20, borderRadius: 8, borderLeft: '4px solid #EAB308' }}>
                <p style={{ fontSize: 16, fontStyle: 'italic', color: '#78350F', margin: 0 }}>
                  "I spent 3 years guessing. BioStackr showed me the answer in 2 weeks."
                </p>
              </div>
            </div>
            <div>
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 30, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h4 style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>Priya's December 2024</h4>
                  <div style={{ background: '#10B981', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Pattern Found</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 10 }}>
                  {['M','T','W','T','F','S','S'].map((d, i) => (
                    <div key={`pdsh-${i}`} style={{ textAlign: 'center', fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{d}</div>
                  ))}
                </div>
                {/* Simplified three-week grid */}
                {[0,1,2].map((week) => (
                  <div key={`pdsw-${week}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                    {[...Array(7)].map((_, i) => {
                      const isGood = [2,3,4,10,11,12,16,17,18,19,20].includes(week*7 + i);
                      const isOk = [5,6,13,14,15].includes(week*7 + i);
                      const color = isGood ? '#10B981' : isOk ? '#EAB308' : '#EF4444';
                      const showDot = [2,3,4,8,9,10,16,17,18,19,20].includes(week*7 + i);
                      return (
                        <div key={`pds-${week}-${i}`} style={{ background: color, height: 35, borderRadius: 4, position: 'relative' }}>
                          {showDot && <div style={{ position: 'absolute', top: 3, right: 3, background: 'white', borderRadius: '50%', width: 8, height: 8 }}></div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTop: '1px solid #E5E7EB', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 15, fontSize: 13 }}>
                    <div><span style={{ color: '#10B981' }}>●</span> Good (3/10)</div>
                    <div><span style={{ color: '#EAB308' }}>●</span> Okay</div>
                    <div><span style={{ color: '#EF4444' }}>●</span> Bad (7/10)</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>⚪ = Took Magnesium</div>
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #10B981', padding: 15, borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#065F46', marginBottom: 5 }}>🎯 Pattern Detected</div>
                  <div style={{ fontSize: 14, color: '#047857' }}>Pain drops to 3/10 when Magnesium taken for 3+ consecutive days</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 30, marginTop: 50 }}>
            <div style={{ background: '#F9FAFB', padding: 25, borderRadius: 8, borderLeft: '4px solid #667eea' }}>
              <div style={{ fontWeight: 600, marginBottom: 10, color: '#1F2937' }}>Marcus discovered:</div>
              <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>His joint pain spiked 24 hours after eating dairy. Eliminated dairy, pain dropped from 8/10 to 4/10 in 2 weeks.</p>
            </div>
            <div style={{ background: '#F9FAFB', padding: 25, borderRadius: 8, borderLeft: '4px solid #667eea' }}>
              <div style={{ fontWeight: 600, marginBottom: 10, color: '#1F2937' }}>Aisha discovered:</div>
              <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>Stress at work triggered flares every Tuesday/Wednesday. Adjusted schedule, flares reduced by 60%.</p>
            </div>
          </div>
          <div style={{ maxWidth: 800, margin: '50px auto 0', textAlign: 'center' }}>
            <div style={{ background: '#F9FAFB', padding: 40, borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: 24, marginBottom: 20, fontWeight: 600, color: '#1F2937' }}>No matter what you're tracking</h3>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#374151', margin: 0 }}>
                Whether you're trying to improve your sleep, see if medications are working, reduce pain levels, identify food triggers, or understand your energy crashes—BioStackr finds the connections. When you take X, you get less Y. When you do A on Monday, B happens on Wednesday. These are the patterns that change everything.
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 50, paddingTop: 40, borderTop: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: 20, color: '#1F2937', fontWeight: 600, marginBottom: 20 }}>That's the power of seeing patterns.</p>
            <a href="/auth/signup" style={{ background: '#1F2937', color: 'white', padding: '14px 28px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>Start Finding Your Patterns</a>
          </div>
        </div>
      </section>
      

      {/* Problem: You're tracking in chaos (duplicate removed) */}
      {/*
      <section style={{ background: '#F9FAFB', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">You're tracking in chaos</h2>
            <p className="text-gray-600 mt-3">Notes, screenshots, voice memos—no patterns, just noise.</p>
                  </div>
          <p style={{ textAlign: 'center', fontSize: 17, color: '#1a1a1a', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
            <strong>Tracking apps make you work too hard.</strong><br/>
            BioStackr gives you smart defaults, takes 20 seconds daily, and actually tells you what to do.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-xl mb-3" aria-hidden>📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes in ten places</h3>
              <p className="text-gray-600 text-sm">Notes in ten places. Screenshots. Voice memos. All noise, no patterns.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-xl mb-3" aria-hidden>🩺</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your doctor doesn't listen</h3>
              <p className="text-gray-600 text-sm">You show them your tracking and they glaze over. You leave feeling dismissed.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-xl mb-3" aria-hidden>❓</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Still Guessing</h3>
              <p className="text-gray-600 text-sm">Was it the new supplement? The stress? The food? You have no idea what's working.</p>
                      </div>
          </div>
        </div>
      </section>
      */}

      
      {/* Built for people living with chronic illness */}
      <section style={{ background: '#FFFFFF', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Built for people living with chronic illness</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fibromyalgia</h3>
              <p className="text-sm text-gray-700">Finally see what's causing your flares. Track pain, energy, and brain fog to identify triggers and bring clear, credible data to your doctor.</p>
                </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Autoimmune Conditions</h3>
              <p className="text-sm text-gray-700">Lupus, RA, Hashimoto's, MS—understand what helps during flares and show your doctors patterns they can't dismiss.</p>
              </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chronic Pain</h3>
              <p className="text-sm text-gray-700">Stop guessing. Start seeing what actually reduces your pain.</p>
                </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chronic Fatigue</h3>
              <p className="text-sm text-gray-700">Track crashes and energy patterns. Finally understand what makes you worse.</p>
                </div>
          </div>
        </div>
      </section>

      {/* Finally, a way to show your doctor */}
      <section style={{ background: '#FFFFFF', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Right side - Copy (moved to left for mobile) */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Finally, a way to show your doctor that works</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart privacy controls</h3>
              <p className="text-lg text-gray-600 mb-6">
                No more printouts. No more screenshots. Share your BioStackr timeline through one simple, always-updated link. Your doctor sees pain patterns, what you were trying, and what's helping—all in one place.
              </p>
              
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Module-level controls (show/hide entire categories)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Item-level controls (show/hide individual entries)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>One link, multiple views—people see only what you allow</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Change anytime—people see updates instantly</span>
                </li>
              </ul>
          </div>
          
            {/* Left side - Visual (moved to right for mobile) */}
            <div className="order-2 lg:order-1 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Shareable Link (Doctor View)</h3>
              
              {/* Module-level toggles */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Medications & Supplements</span>
              </div>
                  <span className="text-sm text-green-600 font-medium">ON</span>
            </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Protocols</span>
              </div>
                  <span className="text-sm text-green-600 font-medium">ON</span>
            </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="font-medium text-gray-900">Movement</span>
              </div>
                  <span className="text-sm text-gray-500 font-medium">OFF</span>
            </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="font-medium text-gray-900">Records & Plans</span>
              </div>
                  <span className="text-sm text-gray-500 font-medium">OFF</span>
                  </div>
            </div>

              {/* Item-level toggle example */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">Individual items:</p>
                  <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">• Vitamin D3 5000 IU</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">• Magnesium Glycinate</span>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            </div>
              </div>
                  </div>
            </div>
          </div>
        </div>
      </section>

      

      

      {/* How it works (3 steps with wearables callout) */}
      <section id="how-it-works" style={{ background: '#F9FAFB', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="text-center mb-16">
            <p style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.5, color: '#6366f1', fontWeight: 600, marginBottom: 10 }}>Next-generation intelligence</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Quick daily check-ins. Track what you’re trying. See patterns instantly—with smart assistance for spotting triggers.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg">
                1
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Quick Daily Check-In</h3>
                <p className="text-gray-600 leading-relaxed">Pain level? Mood? Sleep quality?</p>
                <p className="text-gray-700 leading-relaxed mt-2">20 seconds, done.</p>
                <p className="text-gray-600 leading-relaxed mt-2">Each morning you'll get a Readiness Score (calculated from your pain and sleep) with clear, actionable patterns—no clutter, just clarity.</p>
                {/* Wearables Support Note */}
                <div style={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', borderRadius: 12, padding: 25, marginTop: 30, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 15 }}>
                    <span style={{ fontSize: 32 }}>⌚</span>
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: 17, color: '#1a1a1a', fontWeight: 600 }}>Use a Whoop, Oura, or Apple Watch?</h4>
                      <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: 15, lineHeight: 1.5 }}>Drop in your daily recovery or readiness score. Takes 5 seconds.<br/>BioStackr connects it to your pain patterns automatically.</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#999', fontStyle: 'italic' }}>Automatic sync coming soon—but manual input keeps things fast today.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg">
                2
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Track What You're Trying</h3>
                <p className="text-gray-600 leading-relaxed">Log meds, supplements, protocols as you try them.</p>
                {/* New visuals under Step 2 */}
                <div style={{ marginTop: 40, textAlign: 'center' }}>
                  {/* Contextual Chips Screenshot */}
                  <div style={{ marginBottom: 40 }}>
                    <p style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 15 }}>Optional context (if you want to add it)</p>
                    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 20, marginBottom: 10 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                        <span style={{ background: '#e8f5e9', padding: '8px 16px', borderRadius: 20, fontSize: 14 }}>🍷 Alcohol</span>
                        <span style={{ background: '#fff3e0', padding: '8px 16px', borderRadius: 20, fontSize: 14 }}>🍔 Heavy meal</span>
                        <span style={{ background: '#e3f2fd', padding: '8px 16px', borderRadius: 20, fontSize: 14 }}>✈️ Travel</span>
                        <span style={{ background: '#fce4ec', padding: '8px 16px', borderRadius: 20, fontSize: 14 }}>💼 Stress at work</span>
                        <span style={{ background: '#f3e5f5', padding: '8px 16px', borderRadius: 20, fontSize: 14 }}>😴 Poor sleep</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: '#666', fontStyle: 'italic' }}>Add context in 2 seconds—or skip it. Your choice.</p>
                  </div>
                  {/* Symptoms Screenshot */}
                  <div>
                    <p style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 15 }}>Track symptoms—or don't</p>
                    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 20, marginBottom: 10 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                        <span style={{ background: '#ffebee', padding: '8px 16px', borderRadius: 20, fontSize: 14 }}>🧠 Brain fog</span>
                        <span style={{ background: '#fff3e0', padding: '8px 16px', borderRadius: 20, fontSize: 14 }}>😴 Fatigue</span>
                        <span style={{ background: '#fce4ec', padding: '8px 16px', borderRadius: 20, fontSize: 14 }}>🤕 Headache</span>
                        <span style={{ background: '#f3e5f5', padding: '8px 16px', borderRadius: 20, fontSize: 14 }}>💪 Muscle pain</span>
                        <span style={{ background: '#e8f5e9', padding: '8px 16px', borderRadius: 20, fontSize: 14 }}>🦴 Joint pain</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: '#666', fontStyle: 'italic', lineHeight: 1.5 }}>Smart defaults make tracking effortless. Track more if you want. Or keep it simple.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg">
                3
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">See Patterns Instantly</h3>
                <p className="text-gray-600 leading-relaxed">Monthly heatmap shows good days vs bad days. Click any day to see what you were doing differently.</p>
                <p className="text-gray-600 leading-relaxed mt-2">Share your timeline with your doctor through one simple link—no PDFs, no screenshots, always up to date.</p>
              </div>
            </div>
          </div>

          {/* (Intelligence messaging moved to Section 2) */}

          <div className="text-center mt-16">
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-black transition-colors shadow-lg"
            >
              <span>Start tracking free</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="text-sm text-gray-500 mt-3">Free to start • Upgrade when ready</p>
          </div>
        </div>
      </section>

      {/* RELIEF BREAK #2 (exact HTML, after section 11) */}
      <section style={{ textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)' }}>
        <p style={{ fontSize: 19, color: '#1a1a1a', maxWidth: 600, margin: '0 auto 15px', lineHeight: 1.6, fontWeight: 500 }}>
          Most people don't need another tracking app.
        </p>
        <p style={{ fontSize: 17, color: '#666', maxWidth: 650, margin: '0 auto', lineHeight: 1.7 }}>
          They just need someone to help them make sense of it all — without the overwhelm, without the judgment, without feeling like they're doing it alone.
        </p>
      </section>

      {/* FOUNDER STORY: I built this for my mom (position 13) */}
      <section style={{ background: '#FFFFFF', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <img src="/og-default.png" alt="Chaotic handwritten health tracking notes" style={{ width: '100%', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB' }} />
              <p style={{ textAlign: 'center', fontSize: 14, color: '#6B7280', marginTop: 15, fontStyle: 'italic' }}>Random notes. No patterns. Just chaos.</p>
            </div>
            <div style={{ lineHeight: 1.8 }}>
              <h2 style={{ fontSize: 42, marginBottom: 30, fontWeight: 600, color: '#1F2937' }}>I built this for my mom</h2>
              <p style={{ fontSize: 18, lineHeight: 1.8, color: '#374151', marginBottom: 25 }}>My mom has dealt with chronic pain throughout her life. For years, she tracked her symptoms in her Notes app—random entries, no patterns, just chaos.</p>
              <blockquote style={{ borderLeft: '4px solid #1F2937', paddingLeft: 24, margin: '35px 0', fontStyle: 'italic', fontSize: 20, color: '#4B5563', lineHeight: 1.7 }}>
                "Her doctors didn't take it seriously. She couldn't figure out what helped vs what made things worse. She was losing hope."
              </blockquote>
              <p style={{ fontSize: 20, fontWeight: 600, color: '#1F2937', margin: '35px 0' }}>So I built BioStackr.</p>
              <p style={{ fontSize: 18, lineHeight: 1.8, color: '#374151', marginBottom: 18 }}>Now she can see patterns. She knows what works. Her doctor listens when she shows them her data.</p>
              <p style={{ fontSize: 18, lineHeight: 1.8, color: '#374151', marginBottom: 18 }}>She's not cured—but she finally understands her condition.</p>
              <p style={{ fontSize: 16, color: '#6B7280', textAlign: 'right', marginTop: 30 }}>- Ben, Founder & Son</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Badge (moved after final footer to keep ordering) */}

      {/* Next Generation Positioning Footer - removed per new order */}

      {/* PRICING SECTION - Updated Style & Messaging */}
      <section id="pricing" style={{ padding: '80px 20px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Simple, honest pricing</p>
            <h2 className="section-title" style={{ marginBottom: 15 }}>Start free. Upgrade when you're ready.</h2>
            <p className="body-text" style={{ maxWidth: 600, margin: '0 auto' }}>No hidden paywalls. Start tracking and seeing patterns today—upgrade for deeper pattern depth when you need it.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, maxWidth: 900, margin: '0 auto' }}>
            {/* FREE PLAN */}
            <div style={{ background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 16, padding: 35, position: 'relative' }}>
              <div style={{ marginBottom: 30 }}>
                <h3 style={{ fontSize: 24, color: '#1a1a1a', fontWeight: 700, marginBottom: 10 }}>Free</h3>
                <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 20 }}>Forever</p>
                <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.6 }}>Everything you need to start finding patterns</p>
              </div>
              <div style={{ marginBottom: 30 }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}><span style={{ color: '#10b981', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: '#374151', fontSize: 15, lineHeight: 1.5 }}>Track pain, mood, sleep</span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}><span style={{ color: '#10b981', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: '#374151', fontSize: 15, lineHeight: 1.5 }}>Up to 10 supplements/meds</span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}><span style={{ color: '#10b981', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: '#374151', fontSize: 15, lineHeight: 1.5 }}>Up to 5 protocols</span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}><span style={{ color: '#10b981', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: '#374151', fontSize: 15, lineHeight: 1.5 }}>Monthly heatmap</span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}><span style={{ color: '#10b981', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: '#374151', fontSize: 15, lineHeight: 1.5 }}>Pattern discovery & heatmaps</span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}><span style={{ color: '#10b981', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: '#374151', fontSize: 15, lineHeight: 1.5 }}>Private by default</span></div>
              </div>
              <a href="/auth/signup" style={{ display: 'block', width: '100%', background: '#1a1a1a', color: 'white', padding: 14, borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>Start Free</a>
            </div>
            {/* PREMIUM PLAN */}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 16, padding: 35, position: 'relative', boxShadow: '0 4px 24px rgba(102,126,234,0.3)' }}>
              <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Most Popular</div>
              <div style={{ marginBottom: 30 }}>
                <h3 style={{ fontSize: 24, color: 'white', fontWeight: 700, marginBottom: 10 }}>Premium</h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, marginBottom: 5 }}>$10/month</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 20 }}>14-day free trial</p>
                <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: 15, lineHeight: 1.6 }}>Unlock the full power of intelligent pattern recognition</p>
              </div>
              <div style={{ marginBottom: 30 }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}><span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 15, lineHeight: 1.5 }}>Everything in Free</span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}><span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: 'white', fontSize: 15, lineHeight: 1.5 }}><strong>Unlimited</strong> supplements & meds</span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}><span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: 'white', fontSize: 15, lineHeight: 1.5 }}><strong>Unlimited</strong> protocols & activities</span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}><span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: 'white', fontSize: 15, lineHeight: 1.5 }}><strong>Doctor-ready summaries</strong> (shareable link)</span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}><span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: 'white', fontSize: 15, lineHeight: 1.5 }}><strong>Advanced pattern detection</strong></span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10, marginBottom: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginTop: 2 }}>✓</span>
                  <div>
                    <span style={{ color: 'white', fontSize: 15, lineHeight: 1.5, display: 'block', marginBottom: 4 }}><strong>See correlations</strong></span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontStyle: 'italic', lineHeight: 1.4 }}>
                      "Pain drops 40% on magnesium days"
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}><span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginTop: 2 }}>✓</span><span style={{ color: 'white', fontSize: 15, lineHeight: 1.5 }}><strong>Priority support</strong></span></div>
              </div>
              <a href="/auth/signup?plan=premium" style={{ display: 'block', width: '100%', background: 'white', color: '#667eea', padding: 14, borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>Start 14-day trial</a>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>🔒 Cancel anytime. No questions asked. Your data stays yours.</p>
          </div>
        </div>
      </section>

      {/* RELIEF BREAK #3 (exact HTML, after section 14) */}
      <section style={{ textAlign: 'center', padding: '60px 20px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: 17, color: '#666', maxWidth: 650, margin: '0 auto', lineHeight: 1.7 }}>
          No pressure. No urgency tactics. Just a tool that's here when you're ready.<br/>
          Your health journey moves at your pace — not ours.
        </p>
      </section>

      {/* Product screenshots removed */}

      {/* Final CTA moved below FAQ */}

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Quick answers to common questions. <Link href="/faq" className="text-indigo-600 hover:text-indigo-700">See full FAQ →</Link></p>
          </div>

          <div className="space-y-8">
            {/* Question 1 */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Is my data private?</h3>
              <p className="text-gray-700 leading-relaxed">
                Yes. Everything is private by default. Only you see your data unless you choose to share it with your doctor or care team through a secure link you control.
              </p>
              <Link href="/faq#privacy" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2 inline-block">Learn more →</Link>
            </div>

            {/* Question 2 */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Do I need to track every day?</h3>
              <p className="text-gray-700 leading-relaxed">No. BioStackr works even if you only track a few times a week. The more you track, the clearer patterns become—but life happens. No guilt.</p>
              <Link href="/faq#tracking" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2 inline-block">Learn more →</Link>
            </div>

            {/* Question 3 */}
            <div className="pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Will this work on my phone?</h3>
              <p className="text-gray-700 leading-relaxed">Yes. Works in any mobile browser (Safari, Chrome, etc.). No app download needed. Designed for tracking in bed during flares.</p>
              <Link href="/faq#mobile" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2 inline-block">Learn more →</Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link 
              href="/faq"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              View Full FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-2xl">💙</span>
              <span className="text-white/90 font-medium">Built for people living with chronic pain</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Stop guessing. Start seeing patterns.</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">Track your pain, mood & sleep against what you’re trying. Finally understand your condition in plain English. Just 20 seconds a day.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Track pain—without the overwhelm</h3>
              <p className="text-white/70 text-sm">Simple daily check‑ins you can do from bed on a flare day</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">See what makes pain better or worse</h3>
              <p className="text-white/70 text-sm">Patterns across sleep, meds/supps, activity and stress—explained clearly</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Bring answers to appointments</h3>
              <p className="text-white/70 text-sm">A private link shows your doctor patterns they can’t dismiss</p>
            </div>
          </div>

          <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup" className="bg-white text-gray-900 px-6 py-3 rounded-lg text-base font-semibold hover:bg-gray-100 transition-colors">Start Free - No Credit Card</Link>
              {/* Removed Examples button */}
            </div>
                <div className="mt-6 flex items-center justify-center gap-6 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>14-day Pro trial included</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Cancel anytime</span>
              </div>
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
              <Link href="/faq" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
                FAQ
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Link href="/auth/signup" className="block w-full text-center bg-gray-900 text-white py-4 rounded-lg font-semibold">Start Free</Link>
          <p className="text-center text-xs text-gray-600 mt-1">Private by default</p>
        </div>
      </div>
    </div>
  );
}
