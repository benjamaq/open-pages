export default function FounderStory() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <img src="/mum photo.png" alt="Ben and his mum" className="w-full max-w-[500px] h-auto rounded-2xl mx-auto mb-10 shadow-xl" />
        <h2 className="text-3xl md:text-4xl font-bold mb-6">"I Built This After Watching My Mum Suffer"</h2>
        <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
          <p>My mum tried everything for chronic pain for years. Doctors, apps, supplements, trackers. She had more data than ever — but zero answers. Every app gave her graphs. None told her what to actually do.</p>
          <p>So I built BioStackr. Not to give you more data. To give you clarity. To find the hidden patterns your body's been trying to show you.</p>
          <p><strong>This isn't a tech company trying to sell you widgets. It's a tool built by someone who needed it to exist.</strong></p>
        </div>
        <p className="text-sm text-gray-600 mt-8">— Ben, Founder</p>
        <a href="/auth/signup" className="inline-block mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base md:text-lg px-6 md:px-8 py-3 md:py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl">Start Free – Find Your Patterns</a>
      </div>
    </section>
  );
}


