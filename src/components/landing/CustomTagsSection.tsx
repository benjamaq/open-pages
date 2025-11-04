"use client";
import Link from 'next/link'

export default function CustomTagsSection() {
  return (
    <section className="custom-tags-section">
      <div className="custom-tags-container">
        <div className="custom-tags-header">
          <h2 className="custom-tags-title">Track anything. Literally anything.</h2>
          <p className="custom-tags-subtitle">BioStackr comes with 100+ tags. But the real power? Creating your own.</p>
        </div>

        <div className="custom-tags-intro">
          <p>Most tracking apps give you a list of things to track. Caffeine. Exercise. Sleep. Stress. The basics.</p>
          <p>BioStackr gives you that too. But it also gives you something most apps don't: the ability to track ANYTHING in your life and correlate it against everything else.</p>
          <div className="track-examples">
            <p>
              Had sex? Track it.<br />
              Fought with your partner? Track it.<br />
              Took a cold shower? Track it.<br />
              Skipped breakfast? Track it.<br />
              Worked past 9pm? Track it.<br />
              Meditated for 20 minutes? Track it.
            </p>
          </div>
          <p className="intro-closing">We'll analyze it against 700+ other data points and tell you if it matters.</p>
        </div>

        <div className="tags-showcase">
          <h3 className="tags-showcase-label">Real custom tags BioStackr users created:</h3>
          <div className="tags-grid">
            {[
              '🥊 Fight with girlfriend','💪 Cold shower','🍷 Wine with dinner','🧘 Meditated >15min',
              '💼 Worked past 9pm','🚫 Skipped breakfast','🛏️ Had sex','📞 Took work call late',
              '🎮 Played video games','🌡️ Room felt too warm','😤 Argued with boss','🚗 Long commute',
              '🍕 Ate pizza','☕ 2nd coffee after 2pm','📱 Doom scrolled >30min','🎵 Listened to music'
            ].map((t) => (
              <div key={t} className="tag-pill">{t}</div>
            ))}
          </div>
        </div>

        <div className="tag-creation-showcase">
          <h3 className="tag-creation-label">Creating a custom tag takes 5 seconds:</h3>
          <div className="tag-creation-mockup">
            <div className="mockup-header"><h4>Create your own tag</h4></div>
            <div className="mockup-body">
              <label className="mockup-label">What do you want to track?</label>
              <div className="mockup-input-row">
                <input type="text" className="mockup-input" value="Fight with girlfriend" readOnly />
                <button className="mockup-button">+ Create</button>
              </div>
              <div className="mockup-suggestions">
                <p className="suggestions-label">Or choose a suggestion:</p>
                {[
                  ['💬','Had difficult conversation'],
                  ['😤','Felt stressed about relationship'],
                  ['🛏️','Had sex'],
                  ['📞','Late night work call']
                ].map(([icon, text]) => (
                  <div className="suggestion-item" key={text as string}>
                    <span className="suggestion-icon">{icon}</span>
                    <span className="suggestion-text">{text}</span>
                  </div>
                ))}
                <div className="add-own">
                  <span className="add-own-icon">+</span>
                  <span className="add-own-text">Add your own</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="custom-tags-cta">
          <p>Track what matters to you. Not what an app thinks should matter.</p>
          <Link className="cta-button" href="/auth/signup">Start Free →</Link>
        </div>
      </div>

      <style jsx>{`
        .custom-tags-section { background:#F9FAFB; padding:120px 0; width:100%; }
        .custom-tags-container { max-width:1200px; margin:0 auto; padding:0 40px; }
        @media (max-width:1024px){ .custom-tags-section{padding:80px 0} .custom-tags-container{padding:0 32px} }
        @media (max-width:640px){ .custom-tags-section{padding:60px 0} .custom-tags-container{padding:0 24px} }
        .custom-tags-header{ text-align:center; margin-bottom:64px; }
        .custom-tags-title{ font-family:Inter,-apple-system,sans-serif; font-size:48px; font-weight:700; line-height:1.2; letter-spacing:-.02em; color:#1F2937; margin:0 0 24px }
        .custom-tags-subtitle{ font-family:Inter,-apple-system,sans-serif; font-size:24px; color:#6B7280; margin:0 }
        @media (max-width:1024px){ .custom-tags-title{font-size:40px} .custom-tags-subtitle{font-size:20px} }
        @media (max-width:640px){ .custom-tags-header{margin-bottom:48px} .custom-tags-title{font-size:32px} .custom-tags-subtitle{font-size:18px} }
        .custom-tags-intro{ max-width:800px; margin:0 auto 80px; text-align:center }
        .custom-tags-intro p{ font-family:Inter,-apple-system,sans-serif; font-size:18px; line-height:1.7; color:#374151; margin:0 0 24px }
        .track-examples{ margin:32px 0; padding:24px; background:rgba(244,184,96,.05); border-left:4px solid #F4B860; border-radius:8px }
        .track-examples p{ margin:0; line-height:1.9 }
        .intro-closing{ font-weight:500; color:#1F2937; font-size:19px }
        @media (max-width:640px){ .custom-tags-intro{margin-bottom:60px} .custom-tags-intro p{font-size:16px} .intro-closing{font-size:17px} }
        .tags-showcase{ margin-bottom:80px }
        .tags-showcase-label{ font-family:Inter,-apple-system,sans-serif; font-size:20px; font-weight:600; color:#374151; text-align:center; margin:0 0 32px }
        .tags-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; max-width:1100px; margin:0 auto }
        .tag-pill{ background:#fff; border:1px solid #E5E7EB; border-radius:24px; padding:12px 20px; font-family:Inter,-apple-system,sans-serif; font-size:16px; font-weight:500; color:#374151; text-align:center; transition:all .2s ease; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
        .tag-pill:hover{ border-color:#F4B860; box-shadow:0 2px 8px rgba(244,184,96,.15); transform:translateY(-1px) }
        @media (max-width:1024px){ .tags-grid{grid-template-columns:repeat(2,1fr); gap:10px} .tag-pill{font-size:15px; padding:10px 16px} }
        @media (max-width:640px){ .tags-showcase{margin-bottom:60px} .tags-grid{grid-template-columns:1fr; gap:8px} .tag-pill{font-size:14px; padding:10px 16px; white-space:normal} }
        .tag-creation-showcase{ margin-bottom:64px }
        .tag-creation-label{ font-family:Inter,-apple-system,sans-serif; font-size:20px; font-weight:600; color:#374151; text-align:center; margin:0 0 32px }
        .tag-creation-mockup{ max-width:600px; margin:0 auto; background:#fff; border:2px solid #E5E7EB; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,.06); overflow:hidden }
        .mockup-header{ background:linear-gradient(135deg,#14b8a6 0%,#0f766e 100%); padding:20px 32px }
        .mockup-header h4{ font-family:Inter,-apple-system,sans-serif; font-size:20px; font-weight:600; color:#fff; margin:0 }
        .mockup-body{ padding:32px }
        .mockup-label{ display:block; font-family:Inter,-apple-system,sans-serif; font-size:16px; font-weight:500; color:#374151; margin-bottom:12px }
        .mockup-input-row{ display:flex; gap:12px; margin-bottom:32px }
        .mockup-input{ flex:1; font-family:Inter,-apple-system,sans-serif; font-size:16px; padding:12px 16px; border:2px solid #D1D5DB; border-radius:8px; background:#F9FAFB; color:#374151; transition:border-color .2s ease }
        .mockup-input:focus{ outline:none; border-color:#14b8a6; background:#fff }
        .mockup-button{ font-family:Inter,-apple-system,sans-serif; font-size:16px; font-weight:600; padding:12px 24px; background:#F4B860; color:#fff; border:none; border-radius:8px; cursor:pointer; transition:all .2s ease; white-space:nowrap }
        .mockup-button:hover{ background:#e5a84f; transform:translateY(-1px); box-shadow:0 4px 12px rgba(244,184,96,.3) }
        .mockup-suggestions{ border-top:1px solid #E5E7EB; padding-top:24px }
        .suggestions-label{ font-family:Inter,-apple-system,sans-serif; font-size:15px; font-weight:500; color:#6B7280; margin:0 0 16px }
        .suggestion-item{ display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:8px; margin-bottom:8px; cursor:pointer; transition:background-color .2s ease }
        .suggestion-item:hover{ background:#F9FAFB }
        .suggestion-icon{ font-size:20px; line-height:1 }
        .suggestion-text{ font-family:Inter,-apple-system,sans-serif; font-size:15px; color:#374151 }
        .add-own{ display:flex; align-items:center; gap:12px; padding:12px 16px; margin-top:16px; border:2px dashed #D1D5DB; border-radius:8px; cursor:pointer; transition:all .2s ease }
        .add-own:hover{ border-color:#F4B860; background:rgba(244,184,96,.05) }
        .add-own-icon{ font-size:20px; font-weight:600; color:#F4B860; line-height:1 }
        .add-own-text{ font-family:Inter,-apple-system,sans-serif; font-size:15px; font-weight:500; color:#6B7280 }
        @media (max-width:1024px){ .mockup-body{padding:24px} }
        @media (max-width:640px){ .tag-creation-mockup{border-radius:12px} .mockup-header{padding:16px 24px} .mockup-header h4{font-size:18px} .mockup-body{padding:24px 20px} .mockup-input-row{flex-direction:column} .mockup-button{width:100%} }
        .custom-tags-cta{ text-align:center; margin-top:64px }
        .custom-tags-cta p{ font-family:Inter,-apple-system,sans-serif; font-size:20px; font-weight:500; color:#1F2937; margin:0 0 24px }
        .cta-button{ font-family:Inter,-apple-system,sans-serif; font-size:18px; font-weight:600; padding:16px 40px; background:linear-gradient(135deg,#7C3AED 0%, #3B82F6 100%); color:#fff; border:none; border-radius:12px; transition:all .3s ease; box-shadow:0 4px 16px rgba(124,58,237,.3) }
        .cta-button:hover{ transform:translateY(-2px); box-shadow:0 8px 24px rgba(124,58,237,.4) }
        @media (max-width:640px){ .custom-tags-cta p{font-size:18px} .cta-button{font-size:16px; padding:14px 32px; width:100%; max-width:300px} }
      `}</style>
    </section>
  )
}
