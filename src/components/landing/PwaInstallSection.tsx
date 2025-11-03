import Link from "next/link";

export default function PwaInstallSection() {
  return (
    <section id="install" className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black">📱 Install BioStackr in one tap</h2>
          <p className="mt-4 text-lg text-gray-700">No App Store. No waiting. No extra steps.</p>
          <div className="mt-6 rounded-2xl border-2 border-[#E8B86D] bg-gradient-to-r from-[#FFF9F0] to-white p-6 text-left">
            <ol className="space-y-3 text-gray-800 list-decimal list-inside">
              <li>
                Tap <span className="font-semibold">Install</span> at the top of your screen.
              </li>
              <li>BioStackr appears on your home screen like any other app.</li>
              <li>
                Get gentle <span className="font-semibold">daily reminders</span>, open instantly,{" "}
                <span className="font-semibold">works offline</span>, syncs everywhere.
              </li>
            </ol>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-700">
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1">iOS ✓</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1">Android ✓</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1">Desktop ✓</span>
            </div>

            {/* Platform-specific tips */}
            <div className="mt-4 space-y-1 text-xs text-gray-600 text-center">
              <p>
                <span className="font-semibold">iPhone:</span> Share icon → Add to Home Screen
              </p>
              <p>
                <span className="font-semibold">Android:</span> Tap Install app in the banner
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#E8B86D] px-8 py-4 font-semibold text-black transition hover:bg-[#d9a860]"
            >
              Start free — add to home screen
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border-2 border-black px-8 py-4 font-semibold text-black transition hover:bg-black/5"
            >
              See how it works
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Install in one tap · Daily reminders · 20 seconds/day · Free to start
          </p>
        </div>
      </div>
    </section>
  );
}


