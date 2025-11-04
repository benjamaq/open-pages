"use client";
import Link from "next/link";
import Image from "next/image";
import ScrollControls from "@/components/ScrollControls";
import Starfield from "@/components/Starfield";
import PwaTopBanner from "@/components/PwaTopBanner";
import PwaInstallSection from "@/components/landing/PwaInstallSection";
import type React from "react";
import { trackEvent } from "@/lib/analytics";
import WearableTrap from "../components/sections/WearableTrap";
import RealPeople from "../components/sections/RealPeople";
import HowItWorks from "../components/sections/HowItWorks";
import FounderStory from "../components/sections/FounderStory";
import FAQ from "../components/sections/FAQ";
import FinalCTA from "../components/sections/FinalCTA";
import RealPatternsCarousel from "../components/sections/RealPatternsCarousel";
import AdditionalFeatures from "../components/sections/AdditionalFeatures";
import CustomTagsSection from "@/components/landing/CustomTagsSection";
import TimelineStorySection from "@/components/landing/TimelineStorySection";

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-6 lg:px-8 ${className}`}>{children}</div>;
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`py-20 lg:py-28 ${className}`}>{children}</section>;
}

export default function SleepLandingV2() {
  const onCta = (name: string, params?: Record<string, any>) => {
    try { trackEvent(name, { page: "/sleep", ...(params || {}) }); } catch {}
  };
  return (
    <main>
      <PwaTopBanner />
      {/* SECTION 1: HERO (EVENING GRADIENT WITH STARS) */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A4F5C] via-[#2A6B7A] to-[#D4A574]" />
        {/* Stars */}
        <Starfield count={150} opacity={0.7} />
        {/* Moon */}
        <div
          aria-hidden
          className="hidden sm:block absolute right-[10%] top-[12%] w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/90 ring-1 ring-white/60 shadow-[0_0_60px_20px_rgba(255,255,255,0.25)]"
        />
        {/* Content */}
        <Container className="relative z-10 px-6 pt-28 sm:pt-32">
          <div className="max-w-4xl mx-auto">
            <p className="tracking-wide text-white/90 font-light text-[24px] sm:text-[28px] mb-6 text-center">Pattern Discovery for Your Health</p>
            <h1 className="text-[36px] sm:text-[40px] lg:text-[56px] font-bold text-white leading-snug mb-6 text-center">
              Sleep trackers give you a score.
              <br />
              BioStackr finds why you can't sleep.
            </h1>
            <div className="text-[18px] sm:text-[20px] text-white/90 leading-relaxed mb-8 max-w-[760px] mx-auto text-center">
              <p>You've tried magnesium, mouth tape, no screens, early workouts — but you still can't sleep. BioStackr finds patterns that are unique to you so you can sleep again.</p>
            </div>
            <div className="flex gap-4 flex-wrap mb-4 justify-center">
              <Link href="/auth/signup" onClick={() => { onCta('cta_click', { cta: 'start_sleep_discovery' }); onCta('lead', { cta: 'start_sleep_discovery' }); }} className="inline-flex items-center justify-center rounded-lg bg-[#F4B860] h-12 px-6 text-[16px] font-semibold text-[#2C2C2C] transition-all hover:bg-[#E5A850]">Start Sleep Discovery →</Link>
              <Link href="#how-it-works" onClick={() => onCta('cta_click', { cta: 'see_how_it_works' })} className="inline-flex items-center justify-center rounded-lg border-2 border-[#F4B860] px-8 h-12 text-[16px] font-semibold text-white transition-all hover:bg-[#F4B860] hover:text-[#2C2C2C]">See How It Works</Link>
            </div>
            <div className="mt-3 text-center">
              <p className="text-lg md:text-xl font-medium text-white/90">
                <span className="text-[#F4B860] font-bold">Your job:</span> A 20-second check-in daily.
              </p>
              <p className="text-lg md:text-xl text-white/90">You spend more time choosing your socks.</p>
            </div>
            
          </div>
        </Container>
      </section>

      {/* New sections: Wearable Trap and Real People */}
      <WearableTrap />
      <RealPeople />

      {/* HOW IT WORKS */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      

      <RealPatternsCarousel />
      <TimelineStorySection />
      <CustomTagsSection />

      
      

      

      

      

      {/* Removed previous timeline expectations section (replaced by new sections) */}
      <FounderStory />
      <AdditionalFeatures />
      {/* Pricing positioned after Additional Features */}
      <Section className="bg-white" id="pricing">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="rounded-3xl border-2 border-gray-200 bg-white p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-black mb-2">Free</h3>
                <div className="flex items-baseline gap-2 mb-4"><span className="text-5xl font-bold text-black">$0</span><span className="text-gray-500">/month</span></div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Track up to 12 items','Daily check-ins (20 seconds)','Pattern detection','Basic insights'].map((li) => (
                  <li key={li} className="flex items-start gap-3"><svg className="h-6 w-6 text-[#E8B86D] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg><span className="text-gray-700">{li}</span></li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center rounded-lg border-2 border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50">Start Free</Link>
            </div>
            <div className="rounded-3xl border-2 border-[#E8B86D] bg-gradient-to-br from-[#FFF9F0] to-white p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2"><span className="bg-[#E8B86D] text-black px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span></div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-black mb-2">Premium</h3>
                <div className="flex items-baseline gap-2 mb-4"><span className="text-5xl font-bold text-black">$9.99</span><span className="text-gray-500">/month</span></div>
                <p className="text-gray-600">For serious sleep optimization</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Free','Unlimited items to track','Priority support','Export your data'].map((li) => (
                  <li key={li} className="flex items-start gap-3"><svg className="h-6 w-6 text-[#E8B86D] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg><span className="text-gray-900 font-medium">{li}</span></li>
                ))}
              </ul>
              <Link href="/auth/signup/pro" onClick={() => { onCta('cta_click', { cta: 'start_premium' }); onCta('begin_checkout', { plan: 'pro' }); }} className="block w-full text-center rounded-lg bg-[#E8B86D] px-6 py-3 text-base font-semibold text-black transition-all hover:bg-[#d9a860]">Start Premium</Link>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">Cancel anytime · No credit card required for free plan</p>
        </Container>
      </Section>
      <FAQ />
      <FinalCTA />

      {/* SECTION 7: FACTS */}
      <Section className="bg-white">
        <Container>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { h:'700+ combinations', p:'Analyzed per week from your check-ins' },
              { h:'20 seconds', p:'Typical daily tracking time' },
              { h:'Private by default', p:'Your data stays yours' },
              { h:'No wearable needed', p:'Works great without devices' },
            ].map((f) => (
              <div key={f.h} className="rounded-xl border border-gray-200 p-6 bg-gray-50">
                <div className="text-xl font-bold text-black mb-1">{f.h}</div>
                <div className="text-gray-600 text-sm">{f.p}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* PWA Install Section moved to bottom */}
      <PwaInstallSection />

      {/* SECTION 6: FOOTER (LIGHT GRAY) */}
      <footer className="bg-[#F5F5F5] py-12">
        <Container>
          <div className="text-center">
            <div className="flex justify-center gap-6">
              <Link href="/contact" className="text-gray-600 hover:text-black transition">Contact</Link>
              <Link href="/privacy" className="text-gray-600 hover:text-black transition">Privacy</Link>
              <Link href="/terms" className="text-gray-600 hover:text-black transition">Terms</Link>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}


