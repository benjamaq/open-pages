export default function AdditionalFeatures() {
  const features = [
    { icon: '📓', title: 'Private journal', description: 'Log thoughts, moods, notes — all in one place' },
    { icon: '💊', title: 'Supplement tracking', description: 'Track what you take and when it actually helps' },
    { icon: '👥', title: 'Shareable health page', description: 'Let your partner or important people follow your journey' },
  ];
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-4">
          <span className="inline-block uppercase tracking-wide text-xs text-gray-500 mb-3">Additional features</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">More Than Pattern Discovery</h2>
          <p className="text-gray-600 text-lg">BioStackr includes everything you need to understand your health</p>
        </div>
        <div className="grid gap-6 md:gap-8 md:grid-cols-3 max-w-5xl mx-auto mt-10">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-soft hover:shadow-medium transition-shadow"
            >
              <div className="mx-auto mb-5">
                <div className="h-14 w-14 rounded-full p-[2px] mx-auto bg-gradient-to-br from-[#F4B860] to-[#e0a54d]">
                  <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-2xl">
                    {f.icon}
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm mt-10">Still just 20 seconds a day. The depth is there if you want it.</p>
      </div>
    </section>
  );
}


