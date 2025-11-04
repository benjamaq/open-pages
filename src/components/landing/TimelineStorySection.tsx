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
        {/* Punchy intro */}
        <div className="marcus-intro">
          <p>
            Meet Jake. 35. Melbourne. Hadn't slept through the night in 18 months. Woke at 2am like clockwork. Exhausted. Anxious. Tried everything. <strong>Here's what actually worked.</strong>
          </p>
        </div>

        {/* Four-box timeline */}
        <div className="timeline-grid">
          <div className="timeline-box">
            <h3>WEEK 1</h3>
            <div className="subtitle">Quick win</div>
            <p>Day 5:</p>
            <p><strong>Caffeine after 2pm</strong></p>
            <p>→ 40% worse sleep</p>
            <p>Stopped it.</p>
            <p><strong>Stayed asleep 90 min longer.</strong></p>
          </div>

          <div className="timeline-box">
            <h3>WEEKS 2–4</h3>
            <div className="subtitle">More patterns emerge</div>
            <ul>
              <li>Late workouts → broken sleep</li>
              <li>Food after 8pm → restless</li>
              <li>Screen time → no effect</li>
            </ul>
            <p>Sleep getting better.</p>
            <p>Still anxious though.</p>
          </div>

          <div className="timeline-box breakthrough">
            <h3>MONTH 2</h3>
            <div className="subtitle">The breakthrough</div>
            <p><strong>Magnesium (2 years daily)</strong></p>
            <p>→ <strong>HIGHER anxiety</strong> next day</p>
            <p>Everyone said it helps.</p>
            <p><strong>For him? Making it worse.</strong></p>
            <p>Stopped it. Anxiety dropped.</p>
            <p>Energy up. Sleep improved.</p>
          </div>

          <div className="timeline-box">
            <h3>6 MONTHS LATER</h3>
            <div className="subtitle">His proven system</div>
            <ul className="checklist">
              <li>No caffeine after 1pm</li>
              <li>Workouts before 6pm</li>
              <li>NO magnesium</li>
              <li>Food done by 7:30pm</li>
              <li>Morning sun (10+ min)</li>
            </ul>
            <p>Tracks 4–5 days/week.</p>
            <p><strong>Using HIS data. Not guessing.</strong></p>
          </div>
        </div>

        {/* Bottom explanation */}
        <div className="timeline-explanation">
          <p>Jake found caffeine in 5 days. The magnesium twist took 6 weeks. Your timeline will be different.</p>
          <p>Here's the thing: you're not finding one answer and leaving. <strong>You're building a library.</strong> After 6 months, Jake doesn't wonder what helps his sleep—he knows. His dashboard is his health playbook.</p>
          <div className="timeline-summary">
            <p><strong>Week 1:</strong> Something clicks</p>
            <p><strong>Month 2:</strong> A real list forms</p>
            <p><strong>Month 6:</strong> You have a system</p>
          </div>
          <p className="closing-tagline">This isn't a 30-day hack. It's how you understand your health. For life.</p>
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
        .timeline-grid{ display:grid; grid-template-columns:repeat(4, minmax(260px,1fr)); gap:24px; margin:0 auto 64px; max-width:1200px }
        .timeline-box{ background:#fff; border:2px solid #E5E7EB; border-radius:16px; padding:28px; min-height:360px; box-shadow:0 2px 8px rgba(0,0,0,.03); display:flex; flex-direction:column; justify-content:flex-start; overflow-wrap:anywhere }
        .timeline-box h3{ font-size:14px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#6B7280; margin:0 0 6px }
        .timeline-box .subtitle{ font-size:20px; font-weight:600; color:#1F2937; margin:0 0 16px }
        .timeline-box p{ font-size:16px; line-height:1.6; color:#374151; margin:0 0 8px }
        .timeline-box ul{ list-style:none; padding:0; margin:12px 0 }
        .timeline-box ul li{ font-size:16px; line-height:1.6; color:#374151; margin-bottom:6px; display:flex; align-items:flex-start; gap:8px }
        .timeline-box ul li::before{ content:'•'; color:#14b8a6 }
        .timeline-box.breakthrough{ background:rgba(251,191,36,.04); border:3px solid #F59E0B }
        .checklist li::before{ content:'✓'; color:#10B981; font-weight:700; margin-right:8px }
        @media(max-width:1200px){ .timeline-grid{ grid-template-columns:repeat(3, minmax(260px,1fr)) } }
        @media(max-width:1024px){ .timeline-grid{ grid-template-columns:repeat(2, minmax(260px,1fr)) } .timeline-box{ min-height:340px } }
        @media(max-width:640px){ .timeline-grid{ grid-template-columns:1fr; gap:20px } .timeline-box{ min-height:0 } }
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
