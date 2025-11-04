"use client";
import Link from 'next/link'

export default function TimelineStorySection() {
  return (
    <section className="timeline-story-section">
      <div className="timeline-story-container">
        <div className="timeline-header">
          <h2 className="timeline-title">How long does it take to find patterns?</h2>
          <p className="timeline-subtitle">Some show up in days. Others take months. Here's what one person discovered.</p>
        </div>
        {/* Marcus warm intro */}
        <div className="marcus-intro">
          <p>
            Marcus is a 34-year-old software engineer in Melbourne. For two years, he'd been
            struggling with the same issues: falling asleep took 45+ minutes every night, he dealt
            with constant low-grade anxiety that he couldn't shake, and around 2pm each day, his
            energy would crash completely. He'd tried everything—sleep hygiene routines, therapy,
            meditation apps, every supplement his friends recommended. Nothing seemed to work
            consistently. When he found BioStackr, he was skeptical but desperate. He started
            tracking everything: sleep quality, mood, energy, anxiety levels, what he ate, what
            supplements he took, when he exercised. All of it. <strong>Here's what he discovered.</strong>
          </p>
        </div>

        {/* Four-box timeline */}
        <div className="timeline-grid">
          <div className="timeline-box">
            <h3>Week 1: The quick win</h3>
            <p>Day 5, BioStackr flagged something obvious:</p>
            <p><strong>Caffeine after 2pm → 40% worse sleep quality</strong></p>
            <p>Stopped afternoon coffee. Started falling asleep 15 minutes faster within 3 days. Not solved, but better.</p>
          </div>

          <div className="timeline-box">
            <h3>Weeks 2-4: The pattern library grows</h3>
            <p>More patterns emerged:</p>
            <ul>
              <li>Late workouts (after 7pm) → sleep disrupted</li>
              <li>Eating after 8:30pm → worse sleep quality</li>
              <li>Screen time before bed → surprisingly, no effect</li>
            </ul>
            <p>Sleep improving. Still anxious though.</p>
          </div>

          <div className="timeline-box highlight">
            <h3>Month 2: The breakthrough</h3>
            <p>After 6 weeks, BioStackr found something unexpected:</p>
            <p><strong>Magnesium (taken nightly for 2 years) → correlated with HIGHER anxiety the next day</strong></p>
            <p>He'd been taking it because "everyone says it helps." For him? It was making it WORSE.</p>
            <p>Stopped it. Anxiety dropped within a week.</p>
          </div>

          <div className="timeline-box">
            <h3>6 months later: His health system</h3>
            <p>Marcus tracks 4-5 days/week. Not perfect. That's fine.</p>
            <p>His dashboard has a proven list:</p>
            <ul>
              <li>No caffeine after 1pm</li>
              <li>Workouts before 6pm only</li>
              <li>NO magnesium (proven wrong for him)</li>
              <li>Morning sunlight (10+ min) daily</li>
              <li>Heavy conversations before 8pm only</li>
            </ul>
            <p><strong>Not guessing. Using HIS data.</strong></p>
          </div>
        </div>

        {/* Bottom explanation */}
        <div className="timeline-explanation">
          <p>Marcus found some quick insights early—like caffeine timing in just 5 days—and some deeper ones that took weeks to emerge, like the magnesium discovery. Your timeline will look different depending on what you're tracking, how consistent you are, and how complex your patterns are.</p>
          <p>But here's what makes BioStackr different: you're not just finding one thing and moving on. <strong>You're building a personal library of insights over time.</strong> The more you track, the more you learn. After 6 months, Marcus doesn't guess about what helps his sleep or anxiety—he knows. His BioStackr dashboard became his health roadmap. Not someone else's advice. His proven system.</p>
          <div className="timeline-summary">
            <p><strong>Week 1:</strong> You'll probably see something</p>
            <p><strong>Month 2:</strong> You'll have a growing list</p>
            <p><strong>Month 6:</strong> You'll have a complete system</p>
          </div>
          <p className="closing-tagline">This isn't a 30-day challenge. It's your health operating system. For life.</p>
          <Link className="cta-button" href="/auth/signup">Start Free →</Link>
        </div>
      </div>

      <style jsx>{`
        .timeline-story-section{ background:#fff; padding:120px 0; width:100% }
        .timeline-story-container{ max-width:1200px; margin:0 auto; padding:0 40px }
        @media(max-width:1024px){ .timeline-story-section{padding:80px 0} .timeline-story-container{padding:0 32px} }
        @media(max-width:640px){ .timeline-story-section{padding:60px 0} .timeline-story-container{padding:0 24px} }
        .timeline-header{ text-align:center; margin-bottom:64px }
        .timeline-title{ font-family:Inter,-apple-system,sans-serif; font-size:48px; font-weight:700; line-height:1.2; letter-spacing:-.02em; color:#1F2937; margin:0 0 24px }
        .timeline-subtitle{ font-family:Inter,-apple-system,sans-serif; font-size:24px; color:#6B7280; margin:0 }
        @media(max-width:1024px){ .timeline-title{font-size:40px} .timeline-subtitle{font-size:20px} }
        @media(max-width:640px){ .timeline-header{margin-bottom:48px} .timeline-title{font-size:32px} .timeline-subtitle{font-size:18px} }
        .marcus-intro{ max-width:800px; margin:0 auto 48px; text-align:left; font-family:Inter,-apple-system,sans-serif; font-size:18px; line-height:1.8; color:#374151 }
        .marcus-intro strong{ font-weight:600; color:#1F2937 }
        .timeline-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:24px; margin:0 auto 64px; max-width:1200px }
        .timeline-box{ background:#fff; border:2px solid #E5E7EB; border-radius:12px; padding:24px }
        .timeline-box h3{ font-size:20px; font-weight:700; color:#1F2937; margin:0 0 16px }
        .timeline-box p{ font-size:16px; line-height:1.6; color:#374151; margin:0 0 12px }
        .timeline-box ul{ list-style:none; padding:0; margin:12px 0 }
        .timeline-box ul li{ font-size:15px; line-height:1.7; color:#374151; padding-left:20px; position:relative; margin-bottom:8px }
        .timeline-box ul li::before{ content:'•'; position:absolute; left:4px; color:#14b8a6; font-size:18px }
        .timeline-box.highlight{ background:rgba(244,184,96,.05); border:3px solid #F4B860 }
        @media(max-width:1024px){ .timeline-grid{ grid-template-columns:repeat(2,1fr); gap:20px } }
        @media(max-width:640px){ .timeline-grid{ grid-template-columns:1fr; gap:16px } .timeline-box{ padding:20px } }
        .timeline-explanation{ max-width:800px; margin:0 auto 48px; text-align:center }
        .timeline-explanation p{ font-size:18px; line-height:1.8; color:#374151; margin:0 0 24px }
        .timeline-explanation .timeline-summary{ margin:32px 0; font-size:19px; line-height:2; color:#1F2937 }
        .timeline-explanation .timeline-summary strong{ font-weight:600 }
        .timeline-explanation .closing-tagline{ font-size:20px; font-weight:600; color:#1F2937; margin:32px 0 0 }
        .cta-button{ font-family:Inter,-apple-system,sans-serif; font-size:18px; font-weight:600; padding:16px 40px; background:linear-gradient(135deg,#7C3AED 0%, #3B82F6 100%); color:#fff; border:none; border-radius:12px; transition:all .3s ease; box-shadow:0 4px 16px rgba(124,58,237,.3) }
        .cta-button:hover{ transform:translateY(-2px); box-shadow:0 8px 24px rgba(124,58,237,.4) }
      `}</style>
    </section>
  )
}
