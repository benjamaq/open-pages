// Sharing utilities for daily check-in
export type VibeMode = 'pg' | 'raw'

export interface ShareInputs {
  vibe: string
  energy: number
  sleep?: number
  recovery?: number
  supplementsCount?: number
  todayChips?: string[]
  publicUrl: string
  tags?: string[]
  vibeMode?: VibeMode
  note?: string
}

// Vibe normalization (reads well after "I'm feeling …")
const VIBE_NORMALIZE: Record<string, string> = {
  'f—ing broken': 'wrecked',
  'running on fumes': 'running on fumes',
  'under-slept': 'under-slept',
  'wired & tired': 'wired & tired',
  'tired but trying': 'tired but trying',
  'foggy': 'foggy',
  'a bit wonky': 'a bit wonky',
  'a bit sore': 'a bit sore',
  'glassy-eyed': 'glassy-eyed',
  'low and slow': 'low and slow',
  'slow burn': 'on a slow burn',
  'overcaffeinated': 'over-caffeinated',
  'a bit spicy': 'a bit spicy',
  'resetting': 'resetting',
  'rebuilding': 'rebuilding',
  'solid baseline': 'at a solid baseline',
  'back online': 'back online',
  'calm & steady': 'calm & steady',
  'cruising': 'cruising',
  'climbing': 'climbing',
  'crisp and clear': 'crisp & clear',
  'quietly powerful': 'quietly powerful',
  'renegade mode': 'in renegade mode',
  'dialed in': 'dialed in',
  'peaking': 'peaking',
  'laser-focused': 'laser-focused',
  'flow state': 'in flow',
  'bulletproof': 'bulletproof',
  'angel in the sky': 'euphoric',
  'unstoppable': 'unstoppable'
}

const RAW_OVERRIDES: Record<string, string> = {
  'wrecked': 'f—ing broken'
}

export function normalizeVibe(vibe: string, mode: VibeMode = 'pg'): string {
  const key = vibe.trim().toLowerCase()
  const base = VIBE_NORMALIZE[key] ?? vibe
  if (mode === 'raw' && RAW_OVERRIDES[base]) return RAW_OVERRIDES[base]
  return base
}

// Caption Composer (starts with "I'm feeling …")
const TCO_LEN = 23

export function composeCaption(inputs: ShareInputs): string {
  const vibe = normalizeVibe(inputs.vibe, inputs.vibeMode ?? 'pg')

  // Lines (initial)
  let l1 = `I'm feeling ${vibe} — ${inputs.energy}/10`
  let l2 = (inputs.sleep != null || inputs.recovery != null)
    ? `Sleep ${inputs.sleep ?? '—'} • Recovery ${inputs.recovery ?? '—'}`
    : null

  const chips = (inputs.todayChips ?? []).slice(0, 3)
  let l3 = chips.length ? `Today: ${chips.join(' • ')}` : null

  let l4 = (typeof inputs.supplementsCount === 'number')
    ? `Supplements: ${inputs.supplementsCount}`
    : null

  const tags = (inputs.tags && inputs.tags.length ? inputs.tags : ['#biohacking']).slice(0, 2)
  const cta = `Follow my stack → ${inputs.publicUrl}`

  let lines = [l1, l2, l3, l4, cta, tags.join(' ')].filter(Boolean)
  let out = lines.join('\n')

  const calcLen = (s: string) => {
    // approximate: replace URL with 23 chars
    const urlCost = TCO_LEN + 1 // +1 for space/newline
    return s.replace(inputs.publicUrl, '').length + urlCost
  }

  const MAX = 280
  const fit = () => {
    // 1) Abbrev Sleep/Recovery
    if (l2 && calcLen(out) > MAX) {
      l2 = l2.replace('Sleep ', 'S').replace('Recovery ', 'R')
      lines[1] = l2
      out = lines.filter(Boolean).join('\n')
    }
    // 2) Reduce chips
    while (l3 && chips.length > 1 && calcLen(out) > MAX) {
      chips.pop()
      l3 = `Today: ${chips.join(' • ')}`
      lines[2] = l3
      out = lines.filter(Boolean).join('\n')
    }
    // 3) Abbrev supplements
    if (l4 && calcLen(out) > MAX) {
      l4 = l4.replace('Supplements: ', '') + ' supps'
      lines[3] = l4
      out = lines.filter(Boolean).join('\n')
    }
    // 4) Drop second tag
    if (tags.length > 1 && calcLen(out) > MAX) {
      tags.pop()
      lines[5] = tags.join(' ')
      out = lines.filter(Boolean).join('\n')
    }
    // 5) Drop wearables line if still long
    if (l2 && calcLen(out) > MAX) {
      lines[1] = null as any
      out = lines.filter(Boolean).join('\n')
    }
    // 6) Last resort: shorten vibe (strip leading adjectives)
    if (calcLen(out) > MAX) {
      l1 = `I'm feeling ${normalizeVibe(inputs.vibe)} — ${inputs.energy}/10`
      lines[0] = l1
      out = lines.filter(Boolean).join('\n')
    }
    return out
  }

  return fit()
}

// Share Text (Web Share API + fallbacks)
export async function shareText(inputs: ShareInputs): Promise<{ ok: boolean; method: string }> {
  const caption = composeCaption(inputs)

  const shareData: ShareData = {
    text: caption
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return { ok: true, method: 'web-share' }
    } catch (e) {
      // user cancelled; continue to fallbacks
    }
  }

  // Desktop X/Twitter intent fallback
  const intent = new URL('https://twitter.com/intent/tweet')
  intent.searchParams.set('text', caption)
  window.open(intent.toString(), '_blank', 'noopener,noreferrer')
  return { ok: true, method: 'twitter-intent' }
}

// Copy caption
export async function copyCaption(inputs: ShareInputs): Promise<{ ok: boolean }> {
  const caption = composeCaption(inputs)
  await navigator.clipboard.writeText(caption)
  return { ok: true }
}

// Copy link
export async function copyLink(publicUrl: string): Promise<{ ok: boolean }> {
  await navigator.clipboard.writeText(publicUrl)
  return { ok: true }
}

// Share Image (using dom-to-image-more)
export async function shareImageFromNode(node: HTMLElement, filename = 'biostackr-checkin.png'): Promise<{ ok: boolean; method: string }> {
  try {
    // Dynamic import to avoid SSR issues
    const domtoimage = await import('dom-to-image-more')
    const dataUrl = await domtoimage.default.toPng(node, { 
      quality: 1,
      width: 400,
      height: 400,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    })

    // Try Web Share with file (mobile)
    if ((navigator as any).canShare) {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], filename, { type: 'image/png' })

      if ((navigator as any).canShare({ files: [file] })) {
        try {
          await (navigator as any).share({ files: [file] })
          return { ok: true, method: 'web-share-file' }
        } catch (e) { 
          console.log('Web share failed, falling back to download:', e)
          // Fall through to download
        }
      }
    }

    // Fallback: download
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return { ok: true, method: 'download' }
  } catch (error) {
    console.error('Image generation failed:', error)
    throw new Error('Failed to generate image')
  }
}
