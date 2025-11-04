import Link from 'next/link'

export default function TimelineStorySection() {
  return (
    <section className="timeline-story-section">
      <div className="timeline-story-container">
        <div className="timeline-header">
          <h2 className="timeline-title">How long does it take to find patterns?</h2>
          <p className="timeline-subtitle">Some show up in days. Others take months. Here's what one person discovered.</p>
        </div>

        <div className="story-intro">
          <p className="intro-text"><strong>Marcus, 34, had three problems:</strong></p>
          <ul className="problem-list">
            <li>Trouble sleeping (took 45+ minutes to fall asleep)</li>
            <li>Constant low-grade anxiety</li>
            <li>Energy crashes around 2pm</li>
          </ul>
          <p className="intro-text">He'd tried everything. Sleep hygiene. Therapy. Meditation apps. Supplements.</p>
          <p className="intro-text">Started tracking with BioStackr. Sleep quality. Mood. Energy. Anxiety levels. What he ate. What supplements he took. Everything.</p>
        </div>

        <div className="phase-divider" />

        <div className="phase-card">
          <h3 className="phase-title">Week 1: The quick win</h3>
          <p className="phase-text">Day 5, BioStackr flagged something obvious:</p>
          <div className="result-box"><p>Caffeine after 2pm → 40% worse sleep quality</p></div>
          <p className="phase-text">Stopped afternoon coffee. Started falling asleep 15 minutes faster within 3 days. Not solved, but better.</p>
        </div>

        <div className="phase-divider" />

        <div className="phase-card">
          <h3 className="phase-title">Weeks 2-4: The pattern library grows</h3>
          <p className="phase-text">More patterns emerged:</p>
          <ul className="pattern-list">
            <li>Late workouts (after 7pm) → sleep disrupted</li>
            <li>Eating after 8:30pm → worse sleep quality</li>
            <li>Screen time before bed → surprisingly, no effect</li>
          </ul>
          <p className="phase-text">Sleep improving. Still anxious though. Still crashing at 2pm.</p>
        </div>

        <div className="phase-divider" />

        <div className="phase-card phase-card-highlight">
          <h3 className="phase-title">Month 2: The breakthrough</h3>
          <p className="phase-text">After 6 weeks of data, BioStackr found something Marcus never expected:</p>
          <div className="result-box result-box-major"><p>Magnesium (taken nightly for 2 years) → correlated with higher anxiety scores the next day</p></div>
          <p className="phase-text">He'd been taking it because "everyone says magnesium helps anxiety and sleep."</p>
          <p className="phase-text">For him? It was making it WORSE.</p>
          <p className="phase-text">Stopped taking magnesium. Anxiety dropped significantly within a week. Energy more stable. Sleep better.</p>
          <p className="phase-text emphasis">He'd been doing the "right thing" for 2 years. It was the wrong thing for HIS body.</p>
        </div>

        <div className="phase-divider" />

        <div className="phase-card">
          <h3 className="phase-title">6 months later</h3>
          <p className="phase-text">Marcus still tracks 4-5 days a week. Not perfect. Misses days. That's fine.</p>
          <p className="phase-text">His BioStackr dashboard now has a proven list of what works for HIM:</p>
          <ul className="checklist">
            <li>No caffeine after 1pm</li>
            <li>Workouts before 6pm only</li>
            <li>Dinner by 7:30pm</li>
            <li>NO magnesium (counterintuitive but proven)</li>
            <li>Morning sunlight (10+ min) → better energy all day</li>
            <li>Heavy conversations before 8pm (not after)</li>
          </ul>
          <p className="phase-text">When his sleep slips or anxiety spikes, he checks his dashboard, sees what he's been skipping, and adjusts.</p>
          <p className="phase-text emphasis">Not guessing. Not trying random internet advice. Using HIS data.</p>
        </div>

        <div className="story-closing">
          <p className="closing-text">Your timeline won't look exactly like Marcus's.</p>
          <p className="closing-text">Some patterns show up in 3 days (caffeine timing).<br />Others take 6 weeks (supplement effects).<br />Some take months (cumulative stress patterns).</p>
          <p className="closing-text">But if you track consistently — even imperfectly — we find them.</p>
          <div className="closing-divider-large" />
          <div className="timeline-summary">
            <p><strong>Week 1:</strong> You'll see something</p>
            <p><strong>Month 2:</strong> You'll have a list</p>
            <p><strong>Month 6:</strong> You'll have a system</p>
          </div>
          <div className="closing-divider-large" />
          <p className="closing-tagline">Not a 30-day challenge. Your health operating system. For life.</p>
          <Link className="cta-button" href="/auth/signup">Start Free →</Link>
        </div>
      </div>

      <style jsx>{`
        .timeline-story-section{ background:#fff; padding:120px 0; width:100% }
        .timeline-story-container{ max-width:900px; margin:0 auto; padding:0 40px }
        @media(max-width:1024px){ .timeline-story-section{padding:80px 0} .timeline-story-container{padding:0 32px} }
        @media(max-width:640px){ .timeline-story-section{padding:60px 0} .timeline-story-container{padding:0 24px} }
        .timeline-header{ text-align:center; margin-bottom:64px }
        .timeline-title{ font-family:Inter,-apple-system,sans-serif; font-size:48px; font-weight:700; line-height:1.2; letter-spacing:-.02em; color:#1F2937; margin:0 0 24px }
        .timeline-subtitle{ font-family:Inter,-apple-system,sans-serif; font-size:24px; color:#6B7280; margin:0 }
        @media(max-width:1024px){ .timeline-title{font-size:40px} .timeline-subtitle{font-size:20px} }
        @media(max-width:640px){ .timeline-header{margin-bottom:48px} .timeline-title{font-size:32px} .timeline-subtitle{font-size:18px} }
        .story-intro{ margin-bottom:56px }
        .intro-text{ font-family:Inter,-apple-system,sans-serif; font-size:18px; line-height:1.8; color:#374151; margin:0 0 24px }
        .intro-text strong{ font-weight:600; color:#1F2937 }
        .problem-list{ list-style:none; padding:0; margin:24px 0 32px }
        .problem-list li{ font-family:Inter,-apple-system,sans-serif; font-size:18px; line-height:1.8; color:#374151; padding-left:32px; position:relative; margin-bottom:12px }
        .problem-list li::before{ content:'•'; position:absolute; left:12px; color:#F4B860; font-size:24px; line-height:1.4 }
        .phase-divider{ height:1px; background:linear-gradient(to right, transparent, #E5E7EB, transparent); margin:56px 0 }
        @media(max-width:640px){ .intro-text,.problem-list li{font-size:16px} .phase-divider{margin:40px 0} }
        .phase-card{ margin-bottom:56px }
        .phase-title{ font-family:Inter,-apple-system,sans-serif; font-size:28px; font-weight:700; color:#1F2937; margin:0 0 24px; letter-spacing:-.01em }
        .phase-text{ font-family:Inter,-apple-system,sans-serif; font-size:18px; line-height:1.8; color:#374151; margin:0 0 20px }
        .phase-text:last-child{ margin-bottom:0 }
        .phase-text.emphasis{ font-weight:500; color:#1F2937; font-size:19px }
        .result-box{ background:#F9FAFB; border-left:4px solid #14b8a6; border-radius:8px; padding:20px 24px; margin:24px 0 }
        .result-box p{ font-family:Inter,-apple-system,sans-serif; font-size:17px; font-weight:500; color:#1F2937; margin:0; line-height:1.6 }
        .result-box-major{ background:rgba(244,184,96,.08); border-left-color:#F4B860; border-left-width:5px }
        .result-box-major p{ font-size:18px; font-weight:600 }
        .pattern-list{ list-style:none; padding:0; margin:24px 0 }
        .pattern-list li{ font-family:Inter,-apple-system,sans-serif; font-size:18px; line-height:1.8; color:#374151; padding-left:32px; position:relative; margin-bottom:12px }
        .pattern-list li::before{ content:'•'; position:absolute; left:12px; color:#14b8a6; font-size:24px; line-height:1.4 }
        .checklist{ list-style:none; padding:0; margin:24px 0 }
        .checklist li{ font-family:Inter,-apple-system,sans-serif; font-size:18px; line-height:1.8; color:#374151; padding-left:36px; position:relative; margin-bottom:16px }
        .checklist li::before{ content:'✓'; position:absolute; left:8px; color:#F4B860; font-size:20px; font-weight:700; line-height:1.6 }
        .phase-card-highlight{ background:rgba(244,184,96,.03); border-left:5px solid #F4B860; border-radius:12px; padding:32px; margin-left:-8px; margin-right:-8px }
        @media(max-width:640px){ .phase-card{margin-bottom:40px} .phase-title{font-size:24px} .phase-text,.pattern-list li,.checklist li{font-size:16px} .phase-text.emphasis{font-size:17px} .result-box{padding:16px 20px} .result-box p{font-size:16px} .result-box-major p{font-size:17px} .phase-card-highlight{padding:24px 20px; margin-left:-4px; margin-right:-4px} }
        .story-closing{ text-align:center; margin-top:80px }
        .closing-text{ font-family:Inter,-apple-system,sans-serif; font-size:18px; line-height:1.8; color:#374151; margin:0 0 24px }
        .closing-divider-large{ height:2px; max-width:400px; margin:48px auto; background:linear-gradient(to right, transparent, #E5E7EB 20%, #E5E7EB 80%, transparent) }
        .timeline-summary{ margin:40px 0 }
        .timeline-summary p{ font-family:Inter,-apple-system,sans-serif; font-size:20px; line-height:1.8; color:#374151; margin:0 0 16px }
        .timeline-summary strong{ font-weight:700; color:#1F2937 }
        .closing-tagline{ font-family:Inter,-apple-system,sans-serif; font-size:22px; font-weight:600; color:#1F2937; margin:0 0 32px; line-height:1.5 }
        .cta-button{ font-family:Inter,-apple-system,sans-serif; font-size:18px; font-weight:600; padding:16px 40px; background:linear-gradient(135deg,#7C3AED 0%, #3B82F6 100%); color:#fff; border:none; border-radius:12px; transition:all .3s ease; box-shadow:0 4px 16px rgba(124,58,237,.3) }
        .cta-button:hover{ transform:translateY(-2px); box-shadow:0 8px 24px rgba(124,58,237,.4) }
        @media(max-width:640px){ .story-closing{margin-top:60px} .closing-text{font-size:16px} .timeline-summary p{font-size:18px} .closing-tagline{font-size:19px} .closing-divider-large{margin:32px auto} }
      `}</style>
    </section>
  )
}
