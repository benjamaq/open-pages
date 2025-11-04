"use client";
import Link from 'next/link'

export default function CustomTagsSection() {
  return (
    <section className="custom-tags-section">
      <div className="custom-tags-container">
        <div className="custom-tags-header">
          <h2 className="custom-tags-title">Track anything. Literally anything.</h2>
          <p className="custom-tags-subtitle">BioStackr comes with 100+ built-in tags. But the real power? Creating your own.</p>
        </div>

        <div className="custom-tags-intro">
          <p>Most tracking apps give you the basics: caffeine, exercise, sleep, stress. BioStackr gives you that too—but also lets you track ANYTHING in your life and correlate it against 700+ other data points.</p>
          <div className="tag-it-section">
            <p>Testing a protocol? <strong>Tag it.</strong><br />
            Stressful life event? <strong>Tag it.</strong><br />
            Curious about something? <strong>Tag it.</strong></p>
          </div>
          <p>We'll tell you if it matters.</p>
        </div>

        <div className="tags-showcase">
          <h3 className="tags-showcase-label">Examples of custom tags created by BioStackr users:</h3>
          <div className="tags-grid">
            {[
              '🥊 Fight with girlfriend','💪 Cold shower','🍷 Wine with dinner','🧘 Meditated >15min',
              '💼 Worked past 9pm','🛏️ Had sex','📞 Took work call late','😤 Argued with boss'
            ].map((t) => (
              <div key={t} className="tag-pill">{t}</div>
            ))}
          </div>
        </div>

        <div className="tag-creation-mockup-compact">
          <p className="mockup-label">Creating a custom tag takes 5 seconds:</p>
          <div className="mockup-container">
            <div className="mockup-input-row">
              <input type="text" className="mockup-input" value="Fight with girlfriend" readOnly />
              <button className="mockup-button">+ Create</button>
            </div>
            <div className="mockup-suggestions">
              <p className="suggestions-label">Suggestions:</p>
              <span className="suggestion">💬 Late night argument</span>
              <span className="suggestion">🎮 Played video games</span>
              <span className="suggestion">🍕 Ate junk food</span>
              <span className="suggestion">⚡ Felt stressed</span>
            </div>
          </div>
        </div>

        <div className="tag-story-example">
          <p><strong>Remember Jake?</strong> Here's the magnesium discovery in detail:</p>
          <p>Jake tracked "took magnesium" every night for months, assuming it was helping his anxiety. After 6 weeks of data, BioStackr found the opposite: magnesium correlated with <strong>HIGHER anxiety scores</strong> the next day. He stopped taking it. Anxiety dropped significantly within a week.</p>
          <p className="story-emphasis">He'd been following common advice for months. It was making things worse for his body.</p>
        </div>

        <div className="custom-tags-cta">
          <p>Track what matters to you. Not what an app thinks should matter.</p>
          <Link className="cta-button" href="/auth/signup">Start Free →</Link>
        </div>
      </div>

      <style jsx>{`
        .custom-tags-section { background:#F9FAFB; padding:100px 0; width:100%; }
        .custom-tags-container { max-width:1000px; margin:0 auto; padding:0 40px; }
        @media (max-width:1024px){ .custom-tags-section{padding:80px 0} .custom-tags-container{padding:0 32px} }
        @media (max-width:640px){ .custom-tags-section{padding:60px 0} .custom-tags-container{padding:0 24px} }
        .custom-tags-header{ text-align:center; margin-bottom:32px; }
        .custom-tags-title{ font-family:Inter,-apple-system,sans-serif; font-size:48px; font-weight:700; line-height:1.2; letter-spacing:-.02em; color:#1F2937; margin:0 0 24px }
        .custom-tags-subtitle{ font-family:Inter,-apple-system,sans-serif; font-size:24px; color:#6B7280; margin:0 }
        @media (max-width:1024px){ .custom-tags-title{font-size:40px} .custom-tags-subtitle{font-size:20px} }
        @media (max-width:640px){ .custom-tags-header{margin-bottom:48px} .custom-tags-title{font-size:32px} .custom-tags-subtitle{font-size:18px} }
        .custom-tags-intro{ max-width:900px; margin:0 auto 32px; text-align:center }
        .custom-tags-intro p{ font-family:Inter,-apple-system,sans-serif; font-size:18px; line-height:1.7; color:#374151; margin:0 0 16px }
        .tag-it-section{ margin:16px 0; line-height:1.8 }
        .tag-it-section strong{ font-weight:700; color:#1F2937 }
        @media (max-width:640px){ .custom-tags-intro{margin-bottom:40px} .custom-tags-intro p{font-size:16px} }
        .tags-showcase{ margin-bottom:40px }
        .tags-showcase-label{ font-family:Inter,-apple-system,sans-serif; font-size:17px; font-weight:600; color:#374151; text-align:center; margin:0 0 20px }
        .tags-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; max-width:900px; margin:0 auto }
        .tag-pill{ background:#fff; border:1px solid #E5E7EB; border-radius:20px; padding:8px 16px; font-family:Inter,-apple-system,sans-serif; font-size:14px; font-weight:500; color:#374151; text-align:center; transition:all .2s ease }
        .tag-pill:hover{ border-color:#F4B860; box-shadow:0 2px 8px rgba(244,184,96,.15); transform:translateY(-1px) }
        @media (max-width:1024px){ .tags-grid{grid-template-columns:repeat(2,1fr); gap:10px} .tag-pill{font-size:15px; padding:10px 16px} }
        @media (max-width:640px){ .tags-showcase{margin-bottom:40px} .tags-grid{grid-template-columns:1fr; gap:8px} .tag-pill{font-size:14px; white-space:normal} }
        .tag-creation-mockup-compact{ max-width:600px; margin:0 auto 40px }
        .mockup-label{ font-family:Inter,-apple-system,sans-serif; font-size:17px; font-weight:600; color:#374151; text-align:center; margin:0 0 16px }
        .mockup-container{ background:#fff; border:2px solid #E5E7EB; border-radius:12px; padding:20px; box-shadow:0 2px 12px rgba(0,0,0,.04) }
        .mockup-input-row{ display:flex; gap:10px; margin-bottom:16px }
        .mockup-input{ flex:1; font-family:Inter,-apple-system,sans-serif; font-size:15px; padding:10px 14px; border:2px solid #D1D5DB; border-radius:8px; background:#F9FAFB; color:#374151; transition:border-color .2s ease }
        .mockup-input:focus{ outline:none; border-color:#14b8a6; background:#fff }
        .mockup-button{ font-family:Inter,-apple-system,sans-serif; font-size:15px; font-weight:600; padding:10px 20px; background:#F4B860; color:#fff; border:none; border-radius:8px; cursor:pointer; transition:all .2s ease; white-space:nowrap }
        .mockup-button:hover{ background:#e5a84f; transform:translateY(-1px); box-shadow:0 4px 12px rgba(244,184,96,.3) }
        .mockup-suggestions{ padding-top:12px; border-top:1px solid #E5E7EB }
        .suggestions-label{ font-size:13px; font-weight:600; color:#6B7280; margin:0 0 8px; text-transform:uppercase; letter-spacing:.05em }
        .suggestion{ display:inline-block; font-family:Inter,-apple-system,sans-serif; font-size:14px; color:#6B7280; margin-right:16px }
        @media (max-width:640px){ .tag-creation-mockup-compact{margin-bottom:40px} .mockup-container{padding:20px} .mockup-input-row{flex-direction:column} .mockup-button{width:100%} .mockup-suggestions{flex-direction:column; align-items:center; gap:12px} }
        .tag-story-example{ max-width:900px; margin:0 auto 40px; padding:24px 32px; background:rgba(244,184,96,.05); border-left:4px solid #F4B860; border-radius:8px }
        .tag-story-example p{ font-family:Inter,-apple-system,sans-serif; font-size:17px; line-height:1.7; color:#374151; margin:0 0 14px }
        .story-emphasis{ font-size:18px !important; font-weight:500 !important; color:#1F2937 !important }
        @media (max-width:640px){ .tag-story-example{ margin-bottom:40px; padding:24px 20px } .tag-story-example p{ font-size:16px } .story-emphasis{ font-size:16px !important } }
        .custom-tags-cta{ text-align:center; margin-top:0 }
        .custom-tags-cta p{ font-family:Inter,-apple-system,sans-serif; font-size:18px; color:#374151; margin:0 0 20px }
        .closing-tagline{ font-size:20px !important; font-weight:600 !important; color:#1F2937 !important; margin:32px 0 24px !important }
        .cta-button{ font-family:Inter,-apple-system,sans-serif; font-size:18px; font-weight:600; padding:16px 40px; background:linear-gradient(135deg,#7C3AED 0%, #3B82F6 100%); color:#fff; border:none; border-radius:12px; transition:all .3s ease; box-shadow:0 4px 16px rgba(124,58,237,.3) }
        .cta-button:hover{ transform:translateY(-2px); box-shadow:0 8px 24px rgba(124,58,237,.4) }
        @media (max-width:640px){ .custom-tags-cta p{font-size:18px} .cta-button{font-size:16px; padding:14px 32px; width:100%; max-width:300px} }
      `}</style>
    </section>
  )
}
