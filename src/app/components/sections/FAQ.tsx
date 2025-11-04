'use client';

import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = [
    { q: 'Do I need a wearable?', a: 'Nope. BioStackr works with just your daily check-ins (20 seconds). If you have a wearable, you can manually log your sleep score/metrics in BioStackr and we\'ll analyze it alongside everything else.' },
    { q: 'Will this actually work for me?', a: "If there's a pattern in your last 7-14 days of data, we'll find it. Most people see their first breakthrough insight within 2 weeks." },
    { q: 'Is my data private?', a: "Yes. Your health data stays yours. We don't sell it, share it, or train AI models on it. You can export or delete everything at any time." },
    { q: 'What if I forget to check in?', a: "We send gentle daily reminders (you control when). Miss a day? No problem — the AI adjusts. Consistency helps, but perfection isn't required." },
    { q: 'How is this different from keeping a diary?', a: "You can't manually analyze over 700 combinations per week or spot delayed correlations (like dairy on Monday → worse sleep on Wednesday). The AI does what your brain physically can't." },
    { q: 'Is BioStackr an app?', a: "It's a progressive web app (PWA). Just open the website on your phone and 'Add to Home Screen' — it installs like an app, supports push notifications, works offline, and updates automatically. No App Store required." },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Questions You're Probably Asking</h2>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-gray-200 pb-6">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full text-left flex items-center justify-between gap-4 group">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#F4B860] transition-colors">{f.q}</h3>
                <span className="text-2xl text-gray-400 flex-shrink-0">{openIndex === i ? '−' : '+'}</span>
              </button>
              {openIndex === i && (<p className="text-gray-700 mt-4 leading-relaxed">{f.a}</p>)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


