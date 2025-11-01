import OpenAI from 'openai'
import { ELLI_TONE_GUIDE } from './utils/tone-guide'

// Optional humanizer with strict constraints.
// Falls back to the structured message if OpenAI is not configured or fails.
export async function humanizeMessage(structuredMessage: string, condition?: string): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) return structuredMessage
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const condKey = (condition || '').toLowerCase() as keyof typeof ELLI_TONE_GUIDE.conditionSpecific
    const condGuide = ELLI_TONE_GUIDE.conditionSpecific[condKey]
      ? `\nUSER'S CONDITION: ${condition}\nCONDITION-SPECIFIC GUIDANCE:\n${ELLI_TONE_GUIDE.conditionSpecific[condKey].join('\n')}`
      : ''

    const STRICT_PROMPT = `You are Elli, a warm and empathetic health companion.\n\nPERSONALITY & TONE:\n${ELLI_TONE_GUIDE.personality.join('\n')}\n\nSTYLE RULES:\n${ELLI_TONE_GUIDE.styleRules.join('\n')}\n${condGuide}\n\nYOUR TASK:\nRephrase this structured message to sound natural and caring.\n\nCRITICAL RULES:\n1. Keep ALL facts, numbers, badges EXACTLY as written\n2. Keep structure and paragraph breaks\n3. ONLY improve warmth and conversational flow\n4. DO NOT add new information\n5. DO NOT change confidence levels\n6. Keep under 200 words\n\nAVOID:\n${ELLI_TONE_GUIDE.avoid.join('\n')}\n\nMessage to humanize:\n---\n${structuredMessage}\n---\n\nOutput ONLY the rephrased message.`

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: STRICT_PROMPT }],
      temperature: 0.7,
      max_tokens: 350,
    })
    const text = resp.choices?.[0]?.message?.content?.trim()
    return text && text.length > 0 ? text : structuredMessage
  } catch (e) {
    try { console.warn('[humanizer] Falling back to structured:', (e as any)?.message || e) } catch {}
    return structuredMessage
  }
}


