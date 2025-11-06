import React from "react";

type AlexStoryCardProps = {
  name?: string;
  age?: string;
  beforeLabel?: string;
  beforeScore?: string;
  afterLabel?: string;
  afterScore?: string;
  nightsText?: string;
  quote?: string;
  footnote?: string;
  avatarUrl?: string;
};

export function AlexStoryCard({
  name = "Alex",
  age = "42 — 18 months of broken sleep",
  beforeLabel = "Phone in bedroom",
  beforeScore = "3/10",
  afterLabel = "Phone outside bedroom",
  afterScore = "8/10",
  nightsText = "High confidence • 9 nights",
  quote = "I used to scroll in bed every night. When I left my phone in another room, I went to bed with a different intention — to actually sleep. Simple, but it changed everything.",
  footnote = "One change. One week. Now he sleeps through the night.",
  avatarUrl = "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=60",
  variantAlt,
}: AlexStoryCardProps & { variantAlt?: boolean }) {
  return (
    <section aria-labelledby="alex-story" className={`relative isolate overflow-hidden py-12 md:py-16 ${variantAlt ? 'bg-white' : 'bg-white'}`}>
      {variantAlt && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-500/15 to-emerald-500/15 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-500/15 to-purple-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_420px_at_90%_10%,rgba(16,185,129,0.07),transparent),radial-gradient(circle_360px_at_10%_80%,rgba(99,102,241,0.07),transparent)]" />
        </div>
      )}
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <header className="mb-6">
          <p className="mb-2 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            ALEX’S STORY
          </p>
          <h2 id="alex-story" className="text-3xl md:text-4xl font-bold text-slate-900">
            Here’s what pattern discovery looks like
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Not just graphs you decode yourself. Real patterns. Real answers.
          </p>
        </header>

        {/* Top row: avatar + before/after card */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[140px,1fr]">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={`${name} avatar`}
              className="h-16 w-16 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-slate-900">{name}</p>
              <p className="text-sm text-slate-600">{age}</p>
            </div>
          </div>

          {/* Before → After comparison */}
          <div className="rounded-xl border border-slate-200 p-4 md:p-5">
            <div className="grid gap-4 md:grid-cols-2">
              {/* BEFORE */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">{beforeLabel}</p>
                  <span className="text-2xl font-extrabold text-rose-500">{beforeScore}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-rose-300"
                    style={{ width: "32%" }}
                    aria-hidden
                  />
                </div>
              </div>

              {/* AFTER */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">{afterLabel}</p>
                  <span className="text-2xl font-extrabold text-emerald-600">{afterScore}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-300"
                    style={{ width: "80%" }}
                    aria-hidden
                  />
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">{nightsText}</p>
          </div>
        </div>

        {/* Quote */}
        <figure className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <blockquote className="italic text-slate-800">“{quote}”</blockquote>
        </figure>

        <p className="mt-4 text-sm text-slate-600">{footnote}</p>
      </div>
    </section>
  );
}


