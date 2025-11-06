"use client";
import { Sparkles, CheckCircle2 } from "lucide-react";

type Bullet = { id: string; title: string; desc: string };

const ACCENT_FROM = "from-purple-600";
const ACCENT_VIA = "via-amber-400";
const ACCENT_TO = "to-emerald-500";
const BULLET_ACCENT = "text-emerald-600";

const copy = {
  eyebrow: "Why BioStackr is Different",
  headline: "Not just another tracker — we find your patterns",
  sub1: "Most apps show graphs. BioStackr shows what to do.",
  sub2: "Track for 20 seconds/day. We connect timing and interactions to surface what actually helps.",
  bullets: [
    { id: "b1", title: "Answers, not charts", desc: "Plain‑English insights you can act on right away." },
    { id: "b2", title: "Timing really matters", desc: "Coffee at 2pm ≠ coffee at 9am. We test windows and lags." },
    { id: "b3", title: "Built for real life", desc: "Simple taps when you’re tired. Patterns emerge in 7–14 days." },
    { id: "b4", title: "Your data stays yours", desc: "Private by default. Export or delete anytime." },
  ] as Bullet[],
};

export default function WhyDifferent() {
  return (
    <section className="bg-gray-50 py-20 px-8">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
          💡 Why BioStackr is different
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
          Not just another tracking app
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
          Most health trackers collect data. We connect the dots.
        </p>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          They show you a sleep score. We show you what actually helps.
        </p>
        <div className="bg-white rounded-2xl shadow-lg max-w-4xl mx-auto p-12 text-left">
          <h3 className="text-2xl font-bold text-black mb-8">
            BioStackr is different:
          </h3>
          <ul className="space-y-6">
            <li className="text-xl font-semibold text-black">✅ AI that explains why you can't sleep</li>
            <li className="text-xl font-semibold text-black">✅ Clear insights you can use to improve your sleep</li>
            <li className="text-xl font-semibold text-black">✅ No overwhelm. Just answers.</li>
            <li className="text-xl font-semibold text-black">✅ Simple 20-second daily check-ins</li>
          </ul>
        </div>
      </div>
    </section>
  );
}


