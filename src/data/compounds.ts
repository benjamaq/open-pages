export type ExampleStack = {
  displayName: string
  handle: string // slug or id on your public profile
  url: string    // full public profile link
  blurb?: string // 1-liner context (optional)
}

export type Compound = {
  slug: string
  name: string
  aka?: string
  heroNote: string            // "what people run"
  bullets: string[]           // short facts (dose, timing, brands)
  stacks: ExampleStack[]
  icon?: string               // lucide or emoji fallback
}

export const COMPOUNDS: Compound[] = [
  {
    slug: "creatine-monohydrate",
    name: "Creatine (Monohydrate)",
    heroNote: "5 g daily, anytime; loading optional.",
    bullets: [
      "Form: Monohydrate (Creapure popular)",
      "Dose: 3–5 g daily; skip cycling",
      "Timing: flexible (AM/PM/Pre)",
    ],
    stacks: [
      { displayName: "Ben P", handle: "ben09-168903", url: "https://biostackr.io/biostackr/ben09-168903?public=true", blurb: "Longevity + strength bias" },
      { displayName: "Alex J", handle: "alex-j", url: "https://biostackr.io/examples/alex-j" },
      { displayName: "Sarah C", handle: "sarah-c", url: "https://biostackr.io/examples/sarah-c" },
    ],
    icon: "🏋️",
  },
  {
    slug: "magnesium-glycinate",
    name: "Magnesium (Glycinate)",
    heroNote: "200–400 mg, evening; sleep latency is the common note.",
    bullets: [
      "Form: Glycinate (bisglycinate)",
      "Dose: 200–400 mg elemental",
      "Timing: PM / pre-bed",
      "Brands often seen: Thorne, KAL",
    ],
    stacks: [
      { displayName: "Ben P", handle: "ben09-168903", url: "https://biostackr.io/biostackr/ben09-168903?public=true" },
      { displayName: "Marcus R", handle: "marcus-r", url: "https://biostackr.io/examples/marcus-r" },
      { displayName: "Dana S", handle: "dana-s", url: "https://biostackr.io/examples/dana-s" },
    ],
    icon: "🌙",
  },
  {
    slug: "omega-3-epa-heavy",
    name: "Omega-3 (EPA-heavy)",
    heroNote: "1–2 g EPA/day; take with food.",
    bullets: [
      "Target: ≥1 g EPA (often 2 g)",
      "Timing: with a meal (fat)",
      "Brands: Carlson, Nordic, WHC",
    ],
    stacks: [
      { displayName: "Ben P", handle: "ben09-168903", url: "https://biostackr.io/biostackr/ben09-168903?public=true" },
      { displayName: "Alex J", handle: "alex-j", url: "https://biostackr.io/examples/alex-j" },
    ],
    icon: "🐟",
  },
  {
    slug: "vitamin-d3",
    name: "Vitamin D3",
    heroNote: "2000–5000 IU with fat, AM or midday.",
    bullets: [
      "Dose: 2k–5k IU (lab-guided)",
      "Timing: with fat (breakfast/lunch)",
      "Often paired: K2 (MK-7)",
    ],
    stacks: [
      { displayName: "Sarah C", handle: "sarah-c", url: "https://biostackr.io/examples/sarah-c" },
      { displayName: "Ben P", handle: "ben09-168903", url: "https://biostackr.io/biostackr/ben09-168903?public=true" },
    ],
    icon: "☀️",
  },
  {
    slug: "berberine-dihydroberberine",
    name: "Berberine / Dihydroberberine",
    heroNote: "100–500 mg with carb-heavy meals; DHB is lower dose.",
    bullets: [
      "Form: Berberine or DHB",
      "Timing: pre-meal (carbs)",
      "Note: watch GI tolerance",
    ],
    stacks: [
      { displayName: "Ben P", handle: "ben09-168903", url: "https://biostackr.io/biostackr/ben09-168903?public=true" },
      { displayName: "Marcus R", handle: "marcus-r", url: "https://biostackr.io/examples/marcus-r" },
    ],
    icon: "🍚",
  },
  {
    slug: "ashwagandha",
    name: "Ashwagandha",
    heroNote: "300–600 mg extract; many take PM for calm.",
    bullets: [
      "Extracts: KSM-66 / Sensoril",
      "Dose: 300–600 mg",
      "Timing: PM (or split AM/PM)",
    ],
    stacks: [
      { displayName: "Dana S", handle: "dana-s", url: "https://biostackr.io/examples/dana-s" },
      { displayName: "Alex J", handle: "alex-j", url: "https://biostackr.io/examples/alex-j" },
    ],
    icon: "🧘",
  },
]

export const getCompound = (slug: string) =>
  COMPOUNDS.find(c => c.slug === slug)
