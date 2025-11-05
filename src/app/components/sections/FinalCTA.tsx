import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-teal-700 to-amber-600 text-white text-center">
      <div className="container mx-auto px-6 max-w-4xl">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">Stop Guessing. Start Knowing.</h2>
        <p className="text-2xl md:text-3xl mb-4 font-medium">Most people start seeing patterns within their first week.</p>
        <p className="text-xl md:text-2xl mb-10 opacity-90">That's one week from right now.<br />Start tonight. Sleep better by next week.</p>
        <Link href="/auth/signup" className="inline-block bg-[#F4B860] hover:bg-[#E5A850] text-gray-900 font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-3.5 rounded-full transition-colors shadow-lg hover:shadow-xl whitespace-nowrap">Find Your Sleep Trigger — Free</Link>
        <p className="text-sm mt-8 opacity-75">No credit card · 20 seconds per day · Free to start</p>
      </div>
    </section>
  );
}


