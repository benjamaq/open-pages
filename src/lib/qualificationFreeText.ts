/**
 * Cohort qualification free-text validation (study landing + /api/profiles). No external APIs.
 */

/**
 * Single user-facing copy for every failed check. Never add rule-specific or hinting messages —
 * applicants must not be able to infer how to pass validation.
 */
export const QUALIFICATION_FREETEXT_ERROR =
  "Your response doesn't meet our study criteria." as const

export const QUALIFICATION_WAITLIST_HEADLINE =
  "Thanks for your interest. We'll keep you on the waitlist in case spots open up."

export type QualificationFreeTextResult =
  | { ok: true }
  | { ok: false; error: typeof QUALIFICATION_FREETEXT_ERROR }

const KEYBOARD_PATTERNS = ['asdf', 'qwerty', 'zxcv', '1234'] as const

function keyboardRunSubstringsLen4(): string[] {
  const out = new Set<string>()
  for (const p of KEYBOARD_PATTERNS) {
    const pl = p.toLowerCase()
    if (pl.length < 4) continue
    for (let i = 0; i <= pl.length - 4; i++) {
      out.add(pl.slice(i, i + 4))
    }
  }
  return [...out]
}

const KEYBOARD_FRAGMENTS = keyboardRunSubstringsLen4()

const BANNED_PHRASES = ["don't know", 'dunno', 'no idea', 'n/a', 'nothing'] as const

/** Stored qualification joins free-text with structured answers using this delimiter. */
const STORED_QUAL_SPLIT = '\n| '

/** First segment is the free-text issue (matches client combine order). */
export function extractQualificationFreeText(stored: string | null | undefined): string {
  if (stored == null) return ''
  const s = String(stored)
  const idx = s.indexOf(STORED_QUAL_SPLIT)
  return (idx >= 0 ? s.slice(0, idx) : s).trim()
}

function reject(): { ok: false; error: typeof QUALIFICATION_FREETEXT_ERROR } {
  return { ok: false, error: QUALIFICATION_FREETEXT_ERROR }
}

export function validateQualificationFreeText(response: string): QualificationFreeTextResult {
  const trimmed = String(response || '').trim()

  if (trimmed.length < 20) {
    return reject()
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  const wordsLen2Plus = tokens.filter((w) => w.length >= 2).length
  if (wordsLen2Plus < 4) {
    return reject()
  }

  if (/^(.)\1{4,}$/i.test(trimmed)) {
    return reject()
  }

  const lower = trimmed.toLowerCase()
  for (const frag of KEYBOARD_FRAGMENTS) {
    if (lower.includes(frag)) {
      return reject()
    }
  }

  for (const ph of BANNED_PHRASES) {
    if (lower.includes(ph)) {
      return reject()
    }
  }

  if (/\b(free|idk|test|na)\b/i.test(trimmed)) {
    return reject()
  }

  const fillerStop = new Set([
    'please',
    'thanks',
    'thank',
    'just',
    'only',
    'very',
    'really',
    'much',
    'some',
    'any',
    'well',
    'yeah',
    'okay',
    'yes',
    'sure',
    'fine',
  ])

  const meaningful = new Set<string>()
  for (const w of tokens) {
    const letters = w.toLowerCase().replace(/[^a-z]/g, '')
    if (letters.length >= 4 && !fillerStop.has(letters)) {
      meaningful.add(letters)
    }
  }
  if (meaningful.size <= 2) {
    return reject()
  }

  return { ok: true }
}

/** Admin display: flag short stored qualification_response (full field). */
export function isQualificationResponseVisuallyShort(stored: string | null | undefined): boolean {
  const s = stored != null ? String(stored).trim() : ''
  return s.length > 0 && s.length < 60
}
