# Dashboard UX Map v1

This document outlines the premium dashboard UI intent and implementation notes.

## Components

- Experiments panel (Running Experiments)
  - Panel: bg-gradient-to-b from-purple-50 via-white, border-l-4 border-purple-300, rounded-xl
  - Header: bold title + caret toggle
  - Cards: progress shimmer, check-in counts, microcopy rotation based on phase

- Supplement cards (Your Stack)
  - Confidence ring (80px), status badge, verdict → explanation → instruction
  - Colored left border by status; subtle hover lift
  - Sparkline under the ring for quick trend peek
  - Collapsible technical section (no modal)

## Colors (semantic)

```json
{
  "proven":     { "text": "#047857", "bg": "#D1FAE5", "border": "#A7F3D0" },
  "testing":    { "text": "#6D28D9", "bg": "#EDE9FE", "border": "#DDD6FE" },
  "confounded": { "text": "#92400E", "bg": "#FEF3C7", "border": "#FDE68A" },
  "collecting": { "text": "#374151", "bg": "#F3F4F6", "border": "#E5E7EB" }
}
```

Defined in `src/lib/colors.ts` as `StatusColors`. Use `StatusBadge` for consistent badges.

## Example dataset (mock)

```json
{
  "experiments": [
    { "id": "exp1", "name": "Magnesium Sleep Test", "daysElapsed": 4, "duration": 7, "checkInsCompleted": 4, "checkInsRequired": 7, "status": "active", "hypothesis": "Testing on_off" }
  ],
  "supplements": [
    { "id": "supp1", "name": "Magnesium", "signal": { "n": 42, "effectPct": 9, "confidence": 84, "status": "confirmed", "window": "30d" }, "periods": [{ "startDate": "2025-09-01", "endDate": null }] }
  ]
}
```

## Hover/animation rules

- Card hover: slight lift (translate-y-0.5), shadow-md
- Ring: soft transition on stroke-dasharray; optional gentle pulse for active states
- Progress bars: animate-pulse to imply motion

## Copy guidelines

- Early: “We’re calibrating your baseline — it takes a few days.”
- Mid: “Tracking steady — a few more days before verdict.”
- Near end: “Almost there — final check-ins will confirm your trend.”
- Confounded: “Overlap detected — isolate to get a clear signal.”
- Proven: “Clear positive signal. Add this to your proven stack.”


